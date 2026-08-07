package com.storyreview.controller;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.security.CurrentUser;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.storyreview.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/send-otp")
    MessageResponse sendRegistrationOtp(@Valid @RequestBody RegisterRequest request) { return authService.sendRegistrationOtp(request); }
    @PostMapping("/register/verify")
    AuthResponse verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request) { return authService.verifyRegistration(request); }
    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) { return authService.login(request); }
    @PostMapping("/refresh")
    AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) { return authService.refresh(request); }
    @PostMapping("/forgot-password")
    MessageResponse forgot(@Valid @RequestBody ForgotPasswordRequest request) { authService.forgotPassword(request); return new MessageResponse("Password reset instructions sent if the account exists"); }
    @PostMapping("/reset-password")
    MessageResponse reset(@Valid @RequestBody ResetPasswordRequest request) { authService.resetPassword(request); return new MessageResponse("Password reset complete"); }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    MessageResponse logout(@Valid @RequestBody LogoutRequest request, @AuthenticationPrincipal CurrentUser user) {
        authService.logout(request, user.id());
        return new MessageResponse("Logged out");
    }

}
