package com.storyreview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public final class BookRequests {
    private BookRequests() {}

    // Empty string or an absolute http(s) URL - never javascript:/data:/relative paths.
    private static final String IMAGE_URL_PATTERN = "^$|^https?://.+";
    private static final String IMAGE_URL_MESSAGE = "Image URL must be an http(s) URL";

    public record CreateReviewBookRequest(
            @NotBlank @Size(max = 240) String title,
            @Size(max = 240) String subtitle,
            @NotBlank @Size(max = 4000) String description,
            @Size(max = 500) @Pattern(regexp = IMAGE_URL_PATTERN, message = IMAGE_URL_MESSAGE) String coverImage,
            @Size(max = 80) String language,
            @Size(max = 10) Set<@NotBlank @Size(max = 80) String> genres,
            @Size(max = 20) Set<@NotBlank @Size(max = 80) String> tags,
            LocalDate publicationDate,
            @NotNull Long authorId) {}

    public record CreateDraftBookRequest(
            @NotBlank @Size(max = 240) String title) {}


    public record CompleteBookDetailsRequest(
            @NotBlank @Size(max = 4000) String description,
            @Size(max = 500) @Pattern(regexp = IMAGE_URL_PATTERN, message = IMAGE_URL_MESSAGE) String coverImage,
            @Size(max = 240) String subtitle,
            @Size(max = 80) String language,
            @Size(max = 10) Set<@NotBlank @Size(max = 80) String> genres,
            @Size(max = 20) Set<@NotBlank @Size(max = 80) String> tags,
            LocalDate publicationDate) {}

    public record UpdateBookRequest(
            @NotBlank @Size(max = 240) String title,
            @Size(max = 240) String subtitle,
            @Size(max = 4000) String description,
            @Size(max = 500) @Pattern(regexp = IMAGE_URL_PATTERN, message = IMAGE_URL_MESSAGE) String coverImage,
            @Size(max = 80) String language,
            @Size(max = 10) Set<@NotBlank @Size(max = 80) String> genres,
            @Size(max = 20) Set<@NotBlank @Size(max = 80) String> tags,
            LocalDate publicationDate,
            // Null = keep the book's current author (e.g. legacy USER_BOOKs whose editor
            // never carried an authorId). Non-admin users can only switch to their own
            // user-linked author, enforced in BookServiceImpl.update.
            Long authorId) {}
}
