package com.storyreview.security;

import com.storyreview.enums.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Synthetic id for the env-only super-admin identity - real user ids start at 1. */
    static final long SUPER_ADMIN_ID = 0L;

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserStatusService userStatusService;
    private final String superAdminEmail;

    public JwtAuthenticationFilter(JwtService jwtService, UserStatusService userStatusService,
                                   @Value("${app.security.super-admin-email:}") String superAdminEmail) {
        this.jwtService = jwtService;
        this.userStatusService = userStatusService;
        this.superAdminEmail = superAdminEmail;
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
                Long uid = ((Number) claims.get("uid")).longValue();
                if (Boolean.TRUE.equals(claims.get("su"))) {
                    // Super-admin tokens are re-validated against the env identity on EVERY
                    // request and fail closed: emptying SUPER_ADMIN_EMAIL immediately revokes
                    // every outstanding super-admin session.
                    String email = (String) claims.get("email");
                    if (superAdminEmail != null && !superAdminEmail.isBlank()
                            && superAdminEmail.equalsIgnoreCase(email)) {
                        CurrentUser principal = new CurrentUser(SUPER_ADMIN_ID, email, Role.ADMIN, true);
                        var auth = new UsernamePasswordAuthenticationToken(principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"),
                                        new SimpleGrantedAuthority("ROLE_ADMIN")));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    } else {
                        SecurityContextHolder.clearContext();
                    }
                    filterChain.doFilter(request, response);
                    return;
                }
                // A signed token is not enough: the DB is the source of truth. Banned/disabled
                // accounts and role changes (promote/demote) take effect in seconds, and a
                // forged token cannot escalate beyond the user's actual DB role.
                UserStatusService.AccountStatus status = userStatusService.status(uid);
                if (!status.active()) {
                    log.debug("Rejecting request for inactive user {}", uid);
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }
                CurrentUser principal = new CurrentUser(uid, status.email(), status.role(), false);
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
