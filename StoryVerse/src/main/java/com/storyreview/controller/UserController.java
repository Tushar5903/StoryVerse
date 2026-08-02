package com.storyreview.controller;

import com.storyreview.dto.response.ApiResponses.PublicUserResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.AuthService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    UserResponse getProfile(@AuthenticationPrincipal CurrentUser user) {
        return authService.getProfile(user.id());
    }

    @GetMapping("/{identifier}")
    PublicUserResponse getPublicProfile(@PathVariable String identifier) {
        return authService.getPublicProfile(identifier);
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    UserResponse updateProfile(@RequestParam(required = false) String name,
                               @RequestParam(required = false) String bio,
                               @RequestPart(required = false) MultipartFile image,
                               @AuthenticationPrincipal CurrentUser user) {
        return authService.updateProfile(user.id(), name, bio, image);
    }
}
