package com.storyreview.service.impl;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.PublicUserResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.entity.PasswordResetToken;
import com.storyreview.entity.RefreshToken;
import com.storyreview.entity.User;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.PasswordResetTokenRepository;
import com.storyreview.repository.RefreshTokenRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.security.JwtService;
import com.storyreview.service.AuthService;
import com.storyreview.service.EmailService;
import com.storyreview.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final CloudinaryService cloudinaryService;

    public AuthServiceImpl(UserRepository users, AuthorRepository authors, RefreshTokenRepository refreshTokens, PasswordResetTokenRepository resetTokens, PasswordEncoder passwordEncoder, JwtService jwtService, EmailService emailService, CloudinaryService cloudinaryService) {
        this.users = users;
        this.authors = authors;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.cloudinaryService = cloudinaryService;
    }

    public UserResponse register(RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        if (users.existsByUsernameIgnoreCase(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username is already taken");
        }
        User user = new User();
        user.setName(request.name());
        user.setUsername(request.username().toLowerCase());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setEnabled(true);
        user.setEmailVerified(true);
        user = users.save(user);
        log.info("Registered user {}", user.getEmail());
        return toUserResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        if (!user.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "User account is disabled");
        if (user.isBanned()) throw new ApiException(HttpStatus.FORBIDDEN, "User account is banned");
        log.info("User {} authenticated", user.getEmail());
        return authResponse(user, issueRefresh(user));
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken token = refreshTokens.findByToken(request.refreshToken()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        return authResponse(token.getUser(), token.getToken());
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
    }

    public void logout(LogoutRequest request, Long userId) {
        RefreshToken token = refreshTokens.findByToken(request.refreshToken())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (!token.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token does not belong to the current user");
        }
        token.setRevoked(true);
    }

    public UserResponse updateProfile(Long userId, String name, String bio, org.springframework.web.multipart.MultipartFile image) {
        User user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        if (bio != null) {
            user.setBio(bio.trim());
        }
        if (image != null && !image.isEmpty()) {
            user.setProfileImage(cloudinaryService.uploadProfileImage(image));
        }
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        return toUserResponse(users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found")));
    }

    @Transactional(readOnly = true)
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
                user.getProfileImage(), user.getBio(), authorId, user.getCreatedAt());
    }

    private String issueRefresh(User user) {
        RefreshToken token = new RefreshToken();
        token.setToken(secureToken());
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(7 * 86400));
        return refreshTokens.save(token).getToken();
    }

    private AuthResponse authResponse(User user, String refreshToken) {
        return new AuthResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(), user.getRole(), jwtService.generateAccessToken(user), refreshToken);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(),
                user.getBio(), user.getProfileImage(), user.getRole(), user.isEnabled(),
                user.isEmailVerified(), user.isBanned());
    }

    private String secureToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
