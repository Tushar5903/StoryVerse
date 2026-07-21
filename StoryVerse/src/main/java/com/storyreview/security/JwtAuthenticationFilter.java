package com.storyreview.security;

import com.storyreview.enums.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            // Never let a malformed/expired token throw out of the filter chain: filters run before
            // the DispatcherServlet, so an uncaught exception here bypasses GlobalExceptionHandler
            // entirely and surfaces as a raw container error instead of a clean 401 JSON response.
            try {
                Map<String, Object> claims = jwtService.validate(header.substring(7));
                CurrentUser principal = new CurrentUser(((Number) claims.get("uid")).longValue(), (String) claims.get("email"), Role.valueOf((String) claims.get("role")));
                var auth = new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + principal.role().name())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ex) {
                log.debug("Rejecting request with invalid or expired JWT: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
