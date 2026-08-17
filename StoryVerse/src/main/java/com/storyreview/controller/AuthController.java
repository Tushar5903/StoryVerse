package com.storyreview.controller;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.AuthService;
import com.storyreview.service.RateLimitService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;
    private final RateLimitService rateLimiter;

    @Value("${app.security.rate-limit.send-otp-per-15m:3}")
    private int sendOtpPer15m;
    @Value("${app.security.rate-limit.verify-otp-per-15m:5}")
    private int verifyOtpPer15m;
    @Value("${app.security.rate-limit.login-per-15m:10}")
    private int loginPer15m;
    @Value("${app.security.rate-limit.login-account-per-15m:10}")
    private int loginAccountPer15m;
    @Value("${app.security.rate-limit.forgot-per-hour:3}")
    private int forgotPerHour;
    @Value("${app.security.rate-limit.refresh-per-15m:30}")
    private int refreshPer15m;
    @Value("${app.security.trusted-proxies:}")
    private String trustedProxies;

    public AuthController(AuthService authService, RateLimitService rateLimiter) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
    }

    @PostConstruct
    void warnIfNoTrustedProxies() {
        if (trustedProxies == null || trustedProxies.isBlank()) {
            log.warn("TRUSTED_PROXIES is not configured. Behind a reverse proxy every client will be "
                    + "treated as one IP, so the shared rate-limit bucket can block ALL users - set "
                    + "TRUSTED_PROXIES to the proxy's IP in production.");
        }
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
        // Per-account+IP cap: the per-IP limit alone is useless against a botnet rotating
        // addresses, but keying on the account alone lets any anonymous attacker lock a
        // victim out by burning their attempts. Pairing both still throttles distributed
        // guessing while a remote attacker can only exhaust their own IP's quota against
        // an account. Success resets the pair's bucket.
        String accountKey = "login-acct:" + request.email().toLowerCase() + ":" + clientIp(http);
        rateLimiter.check(accountKey, loginAccountPer15m, 900);
        AuthResponse response = authService.login(request);
        rateLimiter.reset(accountKey);
        return response;
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
        String remote = request.getRemoteAddr();
        // Only trust X-Forwarded-For when the request arrives directly from a configured proxy
        // (nginx/Cloudflare etc. that overwrite the header). Otherwise the header is
        // client-controlled and would let attackers spoof their IP and bypass every rate limit.
        if (isTrustedProxy(remote)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return remote;
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (trustedProxies == null || trustedProxies.isBlank()) {
            return false;
        }
        return java.util.Arrays.stream(trustedProxies.split(","))
                .map(String::trim)
                .filter(ip -> !ip.isBlank())
                .anyMatch(ip -> ip.equals(remoteAddr));
    }
}