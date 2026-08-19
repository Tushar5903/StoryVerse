package com.storyreview.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.storyreview.enums.Role;
import com.storyreview.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Per-request account check for the JWT filter. Access tokens are valid for up to
 * {@code JWT_ACCESS_MINUTES}, but a banned/disabled account (and a role change)
 * must take effect quickly - the DB is the source of truth, not the token claims.
 * The lookup is cached for a few seconds (short TTL) so the hot path stays at one
 * DB hit per user per window. Fails closed: a DB error denies access rather than
 * trusting a stale token, and {@link #invalidate} clears the cache entry right
 * after a super-admin role/status change so the new state applies immediately.
 */
@Service
public class UserStatusService {
    private static final Logger log = LoggerFactory.getLogger(UserStatusService.class);
    private static final long CACHE_TTL_SECONDS = 10;

    /** Snapshot of the authoritative account state for one user. */
    public record AccountStatus(boolean active, Role role, String email) {}

    private final UserRepository users;
    private final Cache<Long, AccountStatus> statusCache;

    public UserStatusService(UserRepository users) {
        this.users = users;
        this.statusCache = Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(CACHE_TTL_SECONDS, TimeUnit.SECONDS)
                .build();
    }

    public boolean isActive(Long userId) {
        return status(userId).active();
    }

    public AccountStatus status(Long userId) {
        try {
            return statusCache.get(userId, this::loadStatus);
        } catch (Exception ex) {
            log.warn("User status lookup failed for user {}; denying access: {}", userId, ex.getMessage());
            return new AccountStatus(false, Role.USER, null);
        }
    }

    /** Drop the cached entry so the next request re-reads the DB (used after role/status changes). */
    public void invalidate(Long userId) {
        statusCache.invalidate(userId);
    }

    private AccountStatus loadStatus(Long userId) {
        return users.findById(userId)
                .map(user -> new AccountStatus(user.isEnabled() && !user.isBanned(), user.getRole(), user.getEmail()))
                .orElse(new AccountStatus(false, Role.USER, null));
    }
}
