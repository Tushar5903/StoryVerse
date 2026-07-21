package com.storyreview.exception;

import com.storyreview.dto.response.ApiResponses.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ApiException also covers subclasses like CloudinaryUploadException.
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> api(ApiException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream().findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage()).orElse("Validation failed");
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> constraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        String message = ex.getConstraintViolations().stream().findFirst()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage()).orElse("Validation failed");
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ApiError> credentials(BadCredentialsException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Invalid email or password", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> denied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Access denied", request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> duplicate(DataIntegrityViolationException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Duplicate record violates a unique constraint", request);
    }

    @ExceptionHandler({MultipartException.class})
    ResponseEntity<ApiError> multipart(MultipartException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Invalid file upload request", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> uploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Uploaded file exceeds the maximum allowed size", request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> illegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage() != null ? ex.getMessage() : "Invalid request", request);
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiError> illegalState(IllegalStateException ex, HttpServletRequest request) {
        log.error("Illegal state", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "The server could not process this request", request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled application error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI()));
    }
}
