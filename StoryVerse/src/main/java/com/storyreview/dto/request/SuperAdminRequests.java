package com.storyreview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class SuperAdminRequests {
    private SuperAdminRequests() {}

    /**
     * The ONLY roles a super admin may assign. "SUPER_ADMIN" is deliberately not
     * accepted here - super-admin is an env-derived identity, never a DB role.
     */
    public record UpdateUserRoleRequest(
            @NotBlank @Pattern(regexp = "ADMIN|USER", message = "Role must be ADMIN or USER") String role) {}

    public record UpdateUserStatusRequest(boolean banned) {}
}