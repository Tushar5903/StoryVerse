package com.storyreview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public final class BookRequests {
    private BookRequests() {}

    public record CreateReviewBookRequest(
            @NotBlank @Size(max = 240) String title,
            @Size(max = 240) String subtitle,
            @NotBlank @Size(max = 4000) String description,
            @Size(max = 500) String coverImage,
            @Size(max = 80) String language,
            @Size(max = 80) String genre,
            Set<@NotBlank @Size(max = 80) String> tags,
            LocalDate publicationDate,
            @NotNull Long authorId) {}

    public record CreateDraftBookRequest(
            @NotBlank @Size(max = 240) String title,
            @NotNull Long authorId) {}


    public record CompleteBookDetailsRequest(
            @NotBlank @Size(max = 4000) String description,
            @Size(max = 500) String coverImage,
            @Size(max = 240) String subtitle,
            @Size(max = 80) String language,
            @Size(max = 80) String genre,
            Set<@NotBlank @Size(max = 80) String> tags,
            LocalDate publicationDate) {}

    public record UpdateBookRequest(
            @NotBlank @Size(max = 240) String title,
            @Size(max = 240) String subtitle,
            @Size(max = 4000) String description,
            @Size(max = 500) String coverImage,
            @Size(max = 80) String language,
            @Size(max = 80) String genre,
            Set<@NotBlank @Size(max = 80) String> tags,
            LocalDate publicationDate,
            @NotNull Long authorId) {}
}
