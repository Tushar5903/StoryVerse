package com.storyreview.service.impl;

import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.entity.User;
import com.storyreview.enums.Role;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.RefreshTokenRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.security.CurrentUser;
import com.storyreview.security.UserStatusService;
import com.storyreview.service.SuperAdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Super-admin mutations. Every method requires a {@code CurrentUser} with
 * {@code superAdmin == true} (enforced at the controller via
 * {@code @PreAuthorize("hasRole('SUPER_ADMIN')")}); the actor is only used for
 * the audit log. The super-admin itself is env-derived and has no DB row, so it
 * can never be a mutation target here.
 */
@Service
public class SuperAdminServiceImpl implements SuperAdminService {
    private static final Logger log = LoggerFactory.getLogger(SuperAdminServiceImpl.class);

    private final UserRepository users;
    private final AuthorRepository authors;
    private final RefreshTokenRepository refreshTokens;
    private final UserStatusService userStatusService;

    public SuperAdminServiceImpl(UserRepository users, AuthorRepository authors,
                                 RefreshTokenRepository refreshTokens, UserStatusService userStatusService) {
        this.users = users;
        this.authors = authors;
        this.refreshTokens = refreshTokens;
        this.userStatusService = userStatusService;
    }

    @Override
    @Transactional
    public UserResponse updateRole(Long userId, String roleName, CurrentUser actor) {
        Role target = Role.valueOf(roleName);
        User user = findUser(userId);
        if (user.getRole() == target) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User already has role " + target);
        }
        user.setRole(target);
        users.save(user);
        // Drop the per-request status cache so the new role applies on the next request.
        userStatusService.invalidate(userId);
        log.info("Super admin {} {} user {} to {}", actor.email(), target == Role.ADMIN ? "promoted" : "demoted",
                userId, target);
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateStatus(Long userId, boolean banned, CurrentUser actor) {
        User user = findUser(userId);
        if (user.isBanned() == banned) {
            throw new ApiException(HttpStatus.BAD_REQUEST, banned ? "User is already banned" : "User is not banned");
        }
        user.setBanned(banned);
        users.save(user);
        if (banned) {
            // A banned account must not mint fresh access tokens via refresh either.
            refreshTokens.revokeAllForUser(userId);
        }
        userStatusService.invalidate(userId);
        log.info("Super admin {} {} user {}", actor.email(), banned ? "banned" : "unbanned", userId);
        return toUserResponse(user);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public void deleteUser(Long userId, CurrentUser actor) {
        findUser(userId);
        refreshTokens.revokeAllForUser(userId);
        // Dependent rows (books, chapters, reviews, progress, author, tokens) go with
        // the user via the ON DELETE CASCADE chain from V14__super_admin_cascade.sql.
        users.deleteById(userId);
        userStatusService.invalidate(userId);
        log.info("Super admin {} deleted user {}", actor.email(), userId);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {"authors", "authorBooks", "bookCatalog"}, allEntries = true)
    public void deleteAuthor(Long authorId, CurrentUser actor) {
        authors.findById(authorId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Author not found"));
        // The author's books (and their chapters/reviews/progress) are removed by the
        // JPA cascade (Author -> books, Book -> chapters) plus the DB cascades.
        authors.deleteById(authorId);
        log.info("Super admin {} deleted author {}", actor.email(), authorId);
    }

    private User findUser(Long userId) {
        return users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(),
                user.getBio(), user.getProfileImage(), user.getDateOfBirth(),
                user.getInstagram(), user.getTwitter(), user.getYoutube(),
                user.getRole(), user.isEnabled(), user.isEmailVerified(), user.isBanned());
    }
}