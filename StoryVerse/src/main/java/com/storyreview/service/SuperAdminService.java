package com.storyreview.service;

import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.security.CurrentUser;

public interface SuperAdminService {
    UserResponse updateRole(Long userId, String role, CurrentUser actor);
    UserResponse updateStatus(Long userId, boolean banned, CurrentUser actor);
    void deleteUser(Long userId, CurrentUser actor);
    void deleteAuthor(Long authorId, CurrentUser actor);
}