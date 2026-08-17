package com.storyreview.dto.response;

import com.storyreview.enums.BookType;
import com.storyreview.enums.AuthorType;
import com.storyreview.enums.ReviewVerdict;
import com.storyreview.enums.Role;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class ApiResponses {
    private ApiResponses() {}

    public record ApiError(Instant timestamp, int status, String error, String message, String path) {}
    public record MessageResponse(String message) {}
    public record ImageUploadResponse(String imageUrl) {}

    public record UserResponse(Long id, String name, String username, String email, String bio, String profileImage,
                               LocalDate dateOfBirth, String instagram, String twitter, String youtube,
                               Role role, boolean enabled, boolean emailVerified, boolean banned) {}
    public record AuthResponse(Long userId, String name, String username, String email, Role role, String accessToken, String refreshToken) {}

    public record AuthorResponse(
            Long id, String name, String profileImage, LocalDate dateOfBirth,
            String placeOfBirth, String biography, AuthorType authorType, Long userId,
            String username, String email, Instant createdAt, Instant updatedAt) {}

    public record BookResponse(
            Long id, String title, String subtitle, String description, String coverImage, String thumbnailUrl,
            BookType bookType, boolean published, String language, String genre, Set<String> genres, Set<String> tags,
            LocalDate publicationDate, Long createdById, Long authorId, String authorName,
            long reviewCount, Instant createdAt, Instant updatedAt) {}

    public record ChapterResponse(
            Long id, Long bookId, int chapterNumber, String chapterTitle,
            String chapterContent, Long wordCount, Instant createdAt, Instant updatedAt) {}

    public record ReviewResponse(
            Long id, Long bookId, Long userId, String username, String name, String profileImage,
            ReviewVerdict verdict, String message, Instant createdAt,
            String bookTitle, String bookCover, BookType bookType, LocalDate publicationDate) {}

    // Aggregated per-book verdict counts for the leaderboard: ONE query for the whole
    // pool instead of a request (and a page of review bodies) per book.
    public record LeaderboardEntry(BookResponse book, long votes, Map<String, Long> verdicts) {}

    public record PublicUserResponse(
            Long id, String name, String username, String profileImage, String bio,
            String instagram, String twitter, String youtube, Long authorId, Instant joinedAt) {}

    public record ProgressResponse(Long bookId, Long chapterId, Instant markedAt) {}

    public record BookProgressResponse(
            Long bookId, String title, String coverImage, String thumbnailUrl,
            String genre, String authorName, long totalChapters, List<ProgressResponse> chapters) {}

    public record AdminDashboardResponse(long users, long books, long reviews) {}
    public record GenresResponse(java.util.List<String> genres) {}
}
