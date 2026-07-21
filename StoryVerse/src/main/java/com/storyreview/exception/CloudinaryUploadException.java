package com.storyreview.exception;

import org.springframework.http.HttpStatus;

public class CloudinaryUploadException extends ApiException {
    public CloudinaryUploadException(String message) {
        super(HttpStatus.BAD_GATEWAY, message);
    }
}
