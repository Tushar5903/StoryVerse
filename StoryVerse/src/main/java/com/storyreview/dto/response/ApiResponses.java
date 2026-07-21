package com.storyreview.dto.response;

import com.storyreview.enums.BookType;
import com.storyreview.enums.ReviewVerdict;
import com.storyreview.enums.Role;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public final class ApiResponses {
    private ApiResponses() {}

    public record ApiError(Instant timestamp, int status, String error, String message, String path) {}
    public record MessageResponse(String message) {}
    public record ImageUploadResponse(String imageUrl) {}

    public record UserResponse(Long id, String name, String username, String email, Role role, boolean enabled, boolean emailVerified, boolean banned) {}
    public record AuthResponse(Long userId, String name, String username, String email, Role role, String accessToken, String refreshToken) {}

    public record AuthorResponse(
            Long id, String name, String profileImage, LocalDate dateOfBirth,
            String placeOfBirth, String biography, Instant createdAt, Instant updatedAt) {}

    public record BookResponse(
            Long id, String title, String subtitle, String description, String coverImage,
            BookType bookType, boolean published, String language, String genre, Set<String> tags,
            LocalDate publicationDate, Long createdById, Long authorId, String authorName,
            Instant createdAt, Instant updatedAt) {}

    public record ChapterResponse(
            Long id, Long bookId, int chapterNumber, String chapterTitle,
            String chapterContent, Instant createdAt, Instant updatedAt) {}

    public record ReviewResponse(
            Long id, Long bookId, Long userId, String username, ReviewVerdict verdict,
            String message, Instant createdAt) {}

    public record AdminDashboardResponse(long users, long books, long reviews) {}
}
