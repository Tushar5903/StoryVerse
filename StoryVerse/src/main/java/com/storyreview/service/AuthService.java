package com.storyreview.service;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
