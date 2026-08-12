package com.storyreview.controller;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.AuthService;
import com.storyreview.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final RateLimitService rateLimiter;

    @Value("${app.security.rate-limit.send-otp-per-15m:3}")
    private int sendOtpPer15m;
    @Value("${app.security.rate-limit.verify-otp-per-15m:5}")
    private int verifyOtpPer15m;
    @Value("${app.security.rate-limit.login-per-15m:10}")
    private int loginPer15m;
    @Value("${app.security.rate-limit.forgot-per-hour:3}")
    private int forgotPerHour;
    @Value("${app.security.rate-limit.refresh-per-15m:30}")
    private int refreshPer15m;

    public AuthController(AuthService authService, RateLimitService rateLimiter) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/register/send-otp")
    MessageResponse sendRegistrationOtp(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        // Per-email cap prevents mail flooding; the 409 enumeration probe is throttled per IP as well.
        rateLimiter.check("send-otp:" + request.email().toLowerCase(), sendOtpPer15m, 900);
        rateLimiter.check("ip:" + clientIp(http), loginPer15m + 10, 900);
        return authService.sendRegistrationOtp(request);
    }

    @PostMapping("/register/verify")
    AuthResponse verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request) {
        // Caps 6-digit guessing: 5 tries per email per 15 minutes against a 1-in-a-million code.
        rateLimiter.check("verify-otp:" + request.email().toLowerCase(), verifyOtpPer15m, 900);
        return authService.verifyRegistration(request);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        rateLimiter.check("login:" + clientIp(http), loginPer15m, 900);
        return authService.login(request);
    }

    @PostMapping("/refresh")
    AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest http) {
        rateLimiter.check("refresh:" + clientIp(http), refreshPer15m, 900);
        return authService.refresh(request);
    }

    @PostMapping("/forgot-password")
    MessageResponse forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        rateLimiter.check("forgot:" + request.email().toLowerCase(), forgotPerHour, 3600);
        authService.forgotPassword(request);
        return new MessageResponse("Password reset instructions sent if the account exists");
    }

    @PostMapping("/reset-password")
    MessageResponse reset(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest http) {
        rateLimiter.check("reset:" + clientIp(http), 10, 3600);
        authService.resetPassword(request);
        return new MessageResponse("Password reset complete");
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    MessageResponse logout(@Valid @RequestBody LogoutRequest request, @AuthenticationPrincipal CurrentUser user) {
        authService.logout(request, user.id());
        return new MessageResponse("Logged out");
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}