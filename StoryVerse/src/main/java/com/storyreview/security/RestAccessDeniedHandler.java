package com.storyreview.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storyreview.dto.response.ApiResponses.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {
    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws java.io.IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = new ApiError(Instant.now(), HttpStatus.FORBIDDEN.value(), HttpStatus.FORBIDDEN.getReasonPhrase(),
                "Access denied", request.getRequestURI());
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
