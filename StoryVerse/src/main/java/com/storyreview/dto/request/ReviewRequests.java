package com.storyreview.dto.request;

import com.storyreview.enums.ReviewVerdict;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ReviewRequests {
    private ReviewRequests() {}

    public record CreateReviewRequest(
            @NotNull Long bookId,
            @NotNull ReviewVerdict verdict,
            @Size(max = 5000) String message) {}

    public record UpdateReviewRequest(
            @NotNull ReviewVerdict verdict,
            @Size(max = 5000) String message) {}
}
