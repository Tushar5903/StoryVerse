package com.storyreview.controller;

import com.storyreview.dto.request.SuperAdminRequests.UpdateUserRoleRequest;
import com.storyreview.dto.request.SuperAdminRequests.UpdateUserStatusRequest;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.dto.response.ApiResponses.SuperAdminSessionResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.SuperAdminService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Super-admin console endpoints. The gate is the {@code ROLE_SUPER_ADMIN}
 * authority, which ONLY the JWT filter grants - it is minted solely from the
 * env-derived super-admin identity (su claim re-validated against
 * {@code SUPER_ADMIN_EMAIL} on every request) and can never be held by a DB
 * account, so a compromised admin account still cannot reach these endpoints.
 * The session probe doubles as the frontend console's "am I still logged in"
 * check: it 403s (via RestAccessDeniedHandler) when the token is missing the
 * authority or the env identity was rotated.
 */
@RestController
@RequestMapping("/api/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @GetMapping("/session")
    public SuperAdminSessionResponse session(@AuthenticationPrincipal CurrentUser currentUser) {
        return new SuperAdminSessionResponse(currentUser.id(), "Super Admin", currentUser.email(),
                currentUser.role().name(), Instant.now());
    }

    @PutMapping("/users/{id}/role")
    public UserResponse updateUserRole(@PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request,
                                       @AuthenticationPrincipal CurrentUser currentUser) {
        return superAdminService.updateRole(id, request.role(), currentUser);
    }

    @PutMapping("/users/{id}/status")
    public UserResponse updateUserStatus(@PathVariable Long id, @Valid @RequestBody UpdateUserStatusRequest request,
                                         @AuthenticationPrincipal CurrentUser currentUser) {
        return superAdminService.updateStatus(id, request.banned(), currentUser);
    }

    @DeleteMapping("/users/{id}")
    public MessageResponse deleteUser(@PathVariable Long id, @AuthenticationPrincipal CurrentUser currentUser) {
        superAdminService.deleteUser(id, currentUser);
        return new MessageResponse("User deleted");
    }

    @DeleteMapping("/authors/{id}")
    public MessageResponse deleteAuthor(@PathVariable Long id, @AuthenticationPrincipal CurrentUser currentUser) {
        superAdminService.deleteAuthor(id, currentUser);
        return new MessageResponse("Author deleted");
    }
}