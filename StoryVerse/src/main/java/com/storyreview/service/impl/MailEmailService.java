package com.storyreview.service.impl;

import com.storyreview.entity.User;
import com.storyreview.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailEmailService implements EmailService {
    private final JavaMailSender mailSender;
    private final String from;
    private final String baseUrl;

    public MailEmailService(JavaMailSender mailSender, @Value("${app.mail.from:no-reply@storyverse.local}") String from, @Value("${app.public-base-url:http://localhost:8081}") String baseUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.baseUrl = baseUrl;
    }

    public void sendPasswordResetEmail(User user, String token) {
        send(user.getEmail(), "Reset your StoryVerse password", "Reset your password using token: " + token);
    }

    public void sendOtpEmail(String email, String code) {
        send(email, "Your StoryVerse verification code", "Your verification code is " + code + ". It expires in 5 minutes.");
    }

    private void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
