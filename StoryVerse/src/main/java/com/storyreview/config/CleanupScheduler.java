package com.storyreview.config;

import com.storyreview.repository.OtpCodeRepository;
import com.storyreview.repository.PasswordResetTokenRepository;
import com.storyreview.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Nightly purge of expired/consumed OTP codes, password-reset tokens and
 * expired refresh tokens so temporary credential tables never grow unbounded.
 */
@Component
public class CleanupScheduler {
    private static final Logger log = LoggerFactory.getLogger(CleanupScheduler.class);
    private final OtpCodeRepository otpCodes;
    private final PasswordResetTokenRepository resetTokens;
    private final RefreshTokenRepository refreshTokens;

    public CleanupScheduler(OtpCodeRepository otpCodes, PasswordResetTokenRepository resetTokens,
                            RefreshTokenRepository refreshTokens) {
        this.otpCodes = otpCodes;
        this.resetTokens = resetTokens;
        this.refreshTokens = refreshTokens;
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredCredentials() {
        Instant now = Instant.now();
        int otps = otpCodes.deleteExpired(now);
        int resets = resetTokens.deleteExpired(now);
        int refreshes = refreshTokens.deleteExpired(now);
        log.info("Purged credential rows: otp={}, reset={}, refresh={}", otps, resets, refreshes);
    }
}