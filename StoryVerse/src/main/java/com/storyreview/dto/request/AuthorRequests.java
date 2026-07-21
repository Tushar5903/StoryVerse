package com.storyreview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public final class AuthorRequests {
    private AuthorRequests() {}

    public record CreateAuthorRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 500) String profileImage,
            @Past LocalDate dateOfBirth,
            @Size(max = 200) String placeOfBirth,
            @Size(max = 5000) String biography) {}

    public record UpdateAuthorRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 500) String profileImage,
            @Past LocalDate dateOfBirth,
            @Size(max = 200) String placeOfBirth,
            @Size(max = 5000) String biography) {}
}
