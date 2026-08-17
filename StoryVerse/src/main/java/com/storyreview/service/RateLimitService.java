package com.storyreview.service;

public interface RateLimitService {
    void check(String key, int maxAttempts, long windowSeconds);
    void reset(String key);
}