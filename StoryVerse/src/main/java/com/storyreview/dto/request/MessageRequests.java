package com.storyreview.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class MessageRequests {
    private MessageRequests() {}

    public record ContactMessageRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Email @Size(max = 190) String email,
            @Size(max = 240) String subject,
            @NotBlank @Size(max = 4000) String message) {}
}
