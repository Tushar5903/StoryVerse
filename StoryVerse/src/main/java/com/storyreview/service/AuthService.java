package com.storyreview.service;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void logout(LogoutRequest request, Long userId);
    UserResponse updateProfile(Long userId, String name, String bio, MultipartFile image);
    UserResponse getProfile(Long userId);
}
