package com.storyreview.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storyreview.entity.User;
import com.storyreview.enums.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    @Test
    void generatesAndValidatesAccessToken() {
        JwtService service = new JwtService(new ObjectMapper(), "test-secret-test-secret-test-secret-32", 15);
        User user = new User();
        user.setId(7L);
        user.setEmail("reader@example.com");
        user.setUsername("reader");
        user.setRole(Role.USER);

        var claims = service.validate(service.generateAccessToken(user));

        assertThat(claims.get("email")).isEqualTo("reader@example.com");
        assertThat(claims.get("role")).isEqualTo("USER");
    }
}
