package com.storyreview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public final class AuthorRequests {
    private AuthorRequests() {}

    private static final String IMAGE_URL_PATTERN = "^$|^https?://.+";
    private static final String IMAGE_URL_MESSAGE = "Profile image must be an http(s) URL";

    public record CreateAuthorRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 500) @Pattern(regexp = IMAGE_URL_PATTERN, message = IMAGE_URL_MESSAGE) String profileImage,
            @Past LocalDate dateOfBirth,
            @Size(max = 200) String placeOfBirth,
            @Size(max = 5000) String biography) {}

    public record UpdateAuthorRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 500) @Pattern(regexp = IMAGE_URL_PATTERN, message = IMAGE_URL_MESSAGE) String profileImage,
            @Past LocalDate dateOfBirth,
            @Size(max = 200) String placeOfBirth,
            @Size(max = 5000) String biography) {}
}
