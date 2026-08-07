package com.storyreview.service;

import com.storyreview.dto.request.AuthRequests.*;
import com.storyreview.dto.response.ApiResponses.AuthResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.dto.response.ApiResponses.PublicUserResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {
    MessageResponse sendRegistrationOtp(RegisterRequest request);
    AuthResponse verifyRegistration(VerifyRegistrationRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void logout(LogoutRequest request, Long userId);
    UserResponse updateProfile(Long userId, String name, String bio, String dateOfBirth, String instagram, String twitter, String youtube, MultipartFile image);
    UserResponse getProfile(Long userId);
    PublicUserResponse getPublicProfile(String identifier);
}
