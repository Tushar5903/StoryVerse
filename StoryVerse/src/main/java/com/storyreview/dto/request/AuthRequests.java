package com.storyreview.dto.request;

import com.storyreview.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthRequests {
    private AuthRequests() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(min = 3, max = 80) @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores") String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull Role role) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record RefreshTokenRequest(@NotBlank String refreshToken) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) String newPassword) {}
}
