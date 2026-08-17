package com.storyreview.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthRequests {
    private AuthRequests() {}

    private static final String PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$";
    private static final String PASSWORD_MESSAGE = "Password must contain at least one uppercase letter, one lowercase letter, and one number";

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(min = 3, max = 80) @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores") String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_PATTERN, message = PASSWORD_MESSAGE) String password) {}

    public record VerifyRegistrationRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(min = 3, max = 80) @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores") String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_PATTERN, message = PASSWORD_MESSAGE) String password,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits") String otp) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record RefreshTokenRequest(@NotBlank String refreshToken) {}
    public record LogoutRequest(@NotBlank String refreshToken) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_PATTERN, message = PASSWORD_MESSAGE) String newPassword) {}
}
