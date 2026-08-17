package com.storyreview.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.storyreview.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Per-request account-status check for the JWT filter. Access tokens are valid
 * for up to {@code JWT_ACCESS_MINUTES}, but a banned or disabled account must
 * lose API access quickly - otherwise the flag is only re-checked at refresh.
 * The lookup is cached for a few seconds (short TTL) so the hot path stays at
 * one DB hit per user per window instead of one per request. Fails closed: a
 * DB error denies access rather than trusting a stale token.
 */
@Service
public class UserStatusService {
    private static final Logger log = LoggerFactory.getLogger(UserStatusService.class);
    private static final long CACHE_TTL_SECONDS = 10;

    private final UserRepository users;
    private final Cache<Long, Boolean> activeCache;

    public UserStatusService(UserRepository users) {
        this.users = users;
        this.activeCache = Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(CACHE_TTL_SECONDS, TimeUnit.SECONDS)
                .build();
    }

    public boolean isActive(Long userId) {
        try {
            return activeCache.get(userId, this::loadActive);
        } catch (Exception ex) {
            log.warn("User status lookup failed for user {}; denying access: {}", userId, ex.getMessage());
            return false;
        }
    }

    private boolean loadActive(Long userId) {
        return users.findById(userId)
                .map(user -> user.isEnabled() && !user.isBanned())
                .orElse(false);
    }
}