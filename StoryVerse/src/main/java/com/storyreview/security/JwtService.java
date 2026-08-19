package com.storyreview.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.storyreview.entity.User;
import com.storyreview.enums.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final long accessMinutes;

    public JwtService(ObjectMapper objectMapper, @Value("${app.security.jwt.secret}") String secret, @Value("${app.security.jwt.access-minutes:15}") long accessMinutes) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.accessMinutes = accessMinutes;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getId().toString());
        payload.put("uid", user.getId());
        payload.put("email", user.getEmail());
        payload.put("role", user.getRole().name());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusSeconds(accessMinutes * 60).getEpochSecond());
        return encode(Map.of("alg", "HS256", "typ", "JWT"), payload);
    }

    /**
     * Super-admin tokens: minted ONLY by the super-admin login endpoint after the
     * env credentials match. The identity is synthetic (uid 0 - real user ids start
     * at 1), role is ADMIN so existing admin paths work, and {@code su: true} is
     * re-validated against the env email by the filter on every request. No refresh
     * tokens - the session dies with the access token.
     */
    public String generateSuperAdminToken(String email) {
        Instant now = Instant.now();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", "0");
        payload.put("uid", 0L);
        payload.put("email", email);
        payload.put("role", Role.ADMIN.name());
        payload.put("su", true);
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusSeconds(accessMinutes * 60).getEpochSecond());
        return encode(Map.of("alg", "HS256", "typ", "JWT"), payload);
    }

    public Map<String, Object> validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !constantTimeEquals(parts[2], sign(parts[0] + "." + parts[1]))) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }
            Map<String, Object> claims = objectMapper.readValue(URL_DECODER.decode(parts[1]), new TypeReference<>() {});
            Number exp = (Number) claims.get("exp");
            if (exp == null || Instant.now().getEpochSecond() >= exp.longValue()) {
                throw new IllegalArgumentException("JWT token expired");
            }
            return claims;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid JWT token", ex);
        }
    }

    private String encode(Map<String, Object> header, Map<String, Object> payload) {
        try {
            String unsigned = URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(header)) + "." + URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(payload));
            return unsigned + "." + sign(unsigned);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate JWT", ex);
        }
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }

    private boolean constantTimeEquals(String left, String right) {
        return java.security.MessageDigest.isEqual(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
    }
}
