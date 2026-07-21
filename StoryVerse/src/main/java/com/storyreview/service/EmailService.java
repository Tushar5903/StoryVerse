package com.storyreview.service;

import com.storyreview.entity.User;

public interface EmailService {
    void sendPasswordResetEmail(User user, String token);
}
