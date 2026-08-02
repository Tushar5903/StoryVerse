package com.storyreview.dto.request;

import jakarta.validation.constraints.NotNull;

public final class ProgressRequests {
    private ProgressRequests() {}

    public record MarkReadRequest(
            @NotNull Long bookId,
            @NotNull Long chapterId) {}
}
