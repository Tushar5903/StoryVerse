package com.storyreview.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ChapterRequests {
    private ChapterRequests() {}

    public record CreateChapterRequest(
            @NotNull @Min(1) Integer chapterNumber,
            @NotBlank @Size(max = 240) String chapterTitle,
            @NotBlank String chapterContent) {}

    public record UpdateChapterRequest(
            @NotNull @Min(1) Integer chapterNumber,
            @NotBlank @Size(max = 240) String chapterTitle,
            @NotBlank String chapterContent) {}
}
