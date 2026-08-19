package com.storyreview.service.impl;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.dto.response.ApiResponses.PublicUserResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.entity.OtpCode;
import com.storyreview.entity.PasswordResetToken;
import com.storyreview.entity.RefreshToken;
import com.storyreview.entity.User;
import com.storyreview.enums.Role;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.OtpCodeRepository;
import com.storyreview.repository.PasswordResetTokenRepository;
import com.storyreview.repository.RefreshTokenRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.security.JwtService;
import com.storyreview.service.AuthService;
import com.storyreview.service.EmailService;
import com.storyreview.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Optional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository users;
    private final AuthorRepository authors;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final OtpCodeRepository otpCodes;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final CloudinaryService cloudinaryService;
    private final long otpTtlSeconds;
    private final long refreshDays;
    private final String superAdminEmail;
    private final String superAdminPassword;
    private final String dummyPasswordHash;

    public AuthServiceImpl(UserRepository users, AuthorRepository authors, RefreshTokenRepository refreshTokens, PasswordResetTokenRepository resetTokens, OtpCodeRepository otpCodes, PasswordEncoder passwordEncoder, JwtService jwtService, EmailService emailService, CloudinaryService cloudinaryService, @Value("${app.security.otp.ttl-seconds:300}") long otpTtlSeconds, @Value("${app.security.jwt.refresh-days:2}") long refreshDays, @Value("${app.security.super-admin-email:}") String superAdminEmail, @Value("${app.security.super-admin-password:}") String superAdminPassword) {
        this.users = users;
        this.authors = authors;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.otpCodes = otpCodes;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.cloudinaryService = cloudinaryService;
        this.otpTtlSeconds = otpTtlSeconds;
        this.refreshDays = refreshDays;
        this.superAdminEmail = superAdminEmail == null ? "" : superAdminEmail.trim();
        this.superAdminPassword = superAdminPassword;
        // Pre-computed at startup so login() can run a BCrypt compare even when the
        // account doesn't exist - otherwise the missing-user path is visibly faster
        // and leaks whether an email is registered (timing side channel).
        this.dummyPasswordHash = passwordEncoder.encode("storyverse-timing-equalizer");
    }

    public MessageResponse sendRegistrationOtp(RegisterRequest request) {
        assertEmailAndUsernameAvailable(request.email(), request.username());
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpCodes.invalidateUnusedForEmail(request.email().toLowerCase());
        OtpCode otp = new OtpCode();
        otp.setEmail(request.email().toLowerCase());
        otp.setCode(code);
        otp.setExpiresAt(Instant.now().plusSeconds(otpTtlSeconds));
        otpCodes.save(otp);
        try {
            emailService.sendOtpEmail(otp.getEmail(), code);
        } catch (Exception ex) {
            log.warn("Failed to send verification code to {}: {}", otp.getEmail(), ex.getMessage());
        }
        return new MessageResponse("Verification code sent to your email");
    }

    public AuthResponse verifyRegistration(VerifyRegistrationRequest request) {
        // Validate the OTP FIRST: with a random/bad code, registered and unregistered
        // emails now return the identical 400, so this endpoint can't be used to probe
        // whether an email exists (the old order leaked a 409 for registered emails
        // before the code was ever checked). The availability check below only runs
        // after a genuine code, which only the email owner can produce.
        OtpCode otp = otpCodes.findFirstByEmailIgnoreCaseAndCodeOrderByCreatedAtDesc(request.email(), request.otp())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code"));
        if (otp.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code already used");
        }
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired. Request a new one");
        }
        assertEmailAndUsernameAvailable(request.email(), request.username());
        if (otpCodes.markUsed(otp.getId()) == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code already used");
        }
        User user = new User();
        user.setName(request.name());
        user.setUsername(request.username().toLowerCase());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user = users.save(user);
        log.info("Registered user {} after OTP verification", user.getEmail());
        return authResponse(user, issueRefresh(user));
    }

    private void assertEmailAndUsernameAvailable(String email, String username) {
        if (users.existsByEmailIgnoreCase(email) || users.existsByUsernameIgnoreCase(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email or username is already in use");
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email()).orElse(null);
        if (user == null) {
            // Equalize timing with the BCrypt compare below so missing accounts are not
            // distinguishable by response time, then fail with the same generic message.
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        if (!user.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "User account is disabled");
        if (user.isBanned()) throw new ApiException(HttpStatus.FORBIDDEN, "User account is banned");
        log.info("User {} authenticated", user.getEmail());
        return authResponse(user, issueRefresh(user));
    }

    /**
     * Super-admin login validates ONLY against the env credentials - there is no DB
     * row, so no account exists to ban, demote, or escalate to. Both fields are
     * compared in constant time (email via {@link java.security.MessageDigest#isEqual},
     * password via BCrypt when the env value is a hash, else constant-time compare),
     * and every failure answers the same generic 401 so the endpoint cannot be used
     * to enumerate valid emails. The minted access token carries {@code su: true}
     * (re-validated against the env email by the filter on every request) and has no
     * refresh token: the session ends when the access token expires.
     */
    @Override
    public AuthResponse superAdminLogin(String email, String password) {
        if (superAdminEmail.isBlank() || superAdminPassword == null || superAdminPassword.isBlank()
                || email == null || password == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid super admin credentials");
        }
        boolean emailOk = constantTimeEquals(email.trim().toLowerCase(), superAdminEmail.toLowerCase());
        boolean passwordOk = matchesSuperAdminPassword(password);
        if (!emailOk || !passwordOk) {
            log.warn("Failed super admin login attempt for {}", emailOk ? superAdminEmail : "unknown email");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid super admin credentials");
        }
        log.info("Super admin logged in as {}", superAdminEmail);
        return new AuthResponse(0L, "Super Admin", "superadmin", superAdminEmail, Role.ADMIN,
                jwtService.generateSuperAdminToken(superAdminEmail), null);
    }

    private boolean matchesSuperAdminPassword(String candidate) {
        String stored = superAdminPassword.trim();
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            return passwordEncoder.matches(candidate, stored);
        }
        return constantTimeEquals(candidate, stored);
    }

    private boolean constantTimeEquals(String left, String right) {
        return java.security.MessageDigest.isEqual(left.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                right.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    /**
     * Refresh tokens are single-use: every successful refresh revokes the presented
     * token and mints a new one. Presenting an already-used/expired token is treated
     * as a possible theft and revokes the whole refresh family for that user.
     * Enabled/banned flags are re-checked here, so a disabled or banned account
     * cannot mint fresh access tokens.
     */
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken token = refreshTokens.findByToken(request.refreshToken())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            refreshTokens.revokeAllForUser(token.getUser().getId());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }
        User user = token.getUser();
        if (!user.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "User account is disabled");
        if (user.isBanned()) throw new ApiException(HttpStatus.FORBIDDEN, "User account is banned");
        token.setRevoked(true);
        return authResponse(user, issueRefresh(user));
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        users.findByEmailIgnoreCase(request.email()).ifPresent(user -> {
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(secureToken());
            token.setUser(user);
            token.setExpiresAt(Instant.now().plusSeconds(3600));
            resetTokens.save(token);
            // The reset token is already persisted at this point, so a flaky/misconfigured SMTP
            // server must never fail the whole request - that would also leak whether the email
            // exists in the system via response status. Log and move on instead.
            try {
                emailService.sendPasswordResetEmail(user, token.getToken());
            } catch (Exception ex) {
                log.warn("Failed to send password reset email to {}: {}", user.getEmail(), ex.getMessage());
            }
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = resetTokens.findByToken(request.token()).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid reset token"));
        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) throw new ApiException(HttpStatus.BAD_REQUEST, "Reset token is expired or used");
        token.getUser().setPasswordHash(passwordEncoder.encode(request.newPassword()));
        token.setUsed(true);
        // A password change must invalidate every outstanding session - otherwise a
        // previously stolen refresh token keeps working long after the reset.
        refreshTokens.revokeAllForUser(token.getUser().getId());
    }

    public void logout(LogoutRequest request, Long userId) {
        RefreshToken token = refreshTokens.findByToken(request.refreshToken())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (!token.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token does not belong to the current user");
        }
        token.setRevoked(true);
    }

    @org.springframework.cache.annotation.CacheEvict(cacheNames = "publicProfiles", allEntries = true)
    public UserResponse updateProfile(Long userId, String name, String bio, String dateOfBirth, String instagram, String twitter, String youtube, MultipartFile image) {
        User user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        if (bio != null) {
            user.setBio(bio.trim());
        }
        if (dateOfBirth != null) {
            if (dateOfBirth.isBlank()) {
                user.setDateOfBirth(null);
            } else {
                LocalDate parsed;
                try {
                    parsed = LocalDate.parse(dateOfBirth);
                } catch (java.time.format.DateTimeParseException ex) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth must be a valid date (YYYY-MM-DD)");
                }
                if (parsed.isAfter(LocalDate.now())) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
                }
                user.setDateOfBirth(parsed);
            }
        }
        user.setInstagram(validateSocial(instagram, "Instagram"));
        user.setTwitter(validateSocial(twitter, "Twitter"));
        user.setYoutube(validateSocial(youtube, "YouTube"));
        if (image != null && !image.isEmpty()) {
            user.setProfileImage(cloudinaryService.uploadProfileImage(image));
        }
        return toUserResponse(user);
    }

    private static final java.util.regex.Pattern SOCIAL_HANDLE = java.util.regex.Pattern.compile("^[A-Za-z0-9_.\\-/]{1,100}$");
    private static final java.util.regex.Pattern SOCIAL_URL = java.util.regex.Pattern.compile("^https?://[A-Za-z0-9_.\\-/:@?&=+~#%]{1,500}$");

    private String validateSocial(String value, String label) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        // Accept a plain handle (the frontend prefixes https://instagram.com/ etc.) or a
        // full http(s) URL - but never javascript:/data:/control characters.
        if (!SOCIAL_HANDLE.matcher(trimmed).matches() && !SOCIAL_URL.matcher(trimmed).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    label + " must be a plain handle or an http(s) URL");
        }
        return trimmed;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        return toUserResponse(users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found")));
    }

    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(cacheNames = "publicProfiles", key = "#identifier")
    public PublicUserResponse getPublicProfile(String identifier) {
        Optional<User> byId = Optional.empty();
        try {
            byId = users.findById(Long.parseLong(identifier));
        } catch (NumberFormatException ignored) {
        }
        if (byId.isPresent()) {
            return toPublicProfile(byId.get());
        }
        return toPublicProfile(users.findByUsernameIgnoreCase(identifier)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found")));
    }

    private PublicUserResponse toPublicProfile(User user) {
        Long authorId = authors.findByUserId(user.getId()).map(author -> author.getId()).orElse(null);
        return new PublicUserResponse(user.getId(), user.getName(), user.getUsername(),
                user.getProfileImage(), user.getBio(), user.getInstagram(), user.getTwitter(), user.getYoutube(),
                authorId, user.getCreatedAt());
    }

    private String issueRefresh(User user) {
        RefreshToken token = new RefreshToken();
        token.setToken(secureToken());
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(refreshDays * 86400));
        return refreshTokens.save(token).getToken();
    }

    private AuthResponse authResponse(User user, String refreshToken) {
        return new AuthResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(), user.getRole(), jwtService.generateAccessToken(user), refreshToken);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(),
                user.getBio(), user.getProfileImage(), user.getDateOfBirth(),
                user.getInstagram(), user.getTwitter(), user.getYoutube(),
                user.getRole(), user.isEnabled(), user.isEmailVerified(), user.isBanned());
    }

    private String secureToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
