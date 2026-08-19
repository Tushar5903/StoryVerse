package com.storyreview.security;

import com.storyreview.enums.Role;

public record CurrentUser(Long id, String email, Role role, boolean superAdmin) {
}
