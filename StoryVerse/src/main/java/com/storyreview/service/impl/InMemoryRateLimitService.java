package com.storyreview.service.impl;

import com.storyreview.exception.ApiException;
import com.storyreview.service.RateLimitService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory fixed-window rate limiter. O(1) per check, no I/O, so it never
 * touches the hot read path. Only used on auth/OTP endpoints. Buckets are
 * purged opportunistically once the map grows past {@link #MAX_BUCKETS}.
 */
@Service
public class InMemoryRateLimitService implements RateLimitService {
    private static final int MAX_BUCKETS = 10_000;
    private static final long PURGE_OLDER_THAN_MILLIS = 24L * 3600 * 1000;

    private record Window(long windowStart, int count) {}

    private final ConcurrentHashMap<String, Window> buckets = new ConcurrentHashMap<>();

    @Override
    public void check(String key, int maxAttempts, long windowSeconds) {
        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000L;
        buckets.compute(key, (k, w) -> {
            if (w == null || now - w.windowStart() >= windowMillis) {
                return new Window(now, 1);
            }
            if (w.count() >= maxAttempts) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Please try again later.");
            }
            return new Window(w.windowStart(), w.count() + 1);
        });
        if (buckets.size() > MAX_BUCKETS) {
            purge(now);
        }
    }

    private void purge(long now) {
        buckets.entrySet().removeIf(e -> now - e.getValue().windowStart() > PURGE_OLDER_THAN_MILLIS);
    }
}