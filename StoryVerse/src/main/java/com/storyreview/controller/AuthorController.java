package com.storyreview.controller;

import com.storyreview.dto.request.AuthorRequests.CreateAuthorRequest;
import com.storyreview.dto.request.AuthorRequests.UpdateAuthorRequest;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.service.AuthorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authors")
public class AuthorController {
    private final AuthorService authorService;

    public AuthorController(AuthorService authorService) {
        this.authorService = authorService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    AuthorResponse create(@Valid @RequestBody CreateAuthorRequest request) {
        return authorService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    AuthorResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAuthorRequest request) {
        return authorService.update(id, request);
    }

    @GetMapping
    Page<AuthorResponse> getAll(Pageable pageable) {
        return authorService.getAll(pageable);
    }

    @GetMapping("/{id}")
    AuthorResponse getById(@PathVariable Long id) {
        return authorService.getById(id);
    }

    @GetMapping("/{id}/books")
    List<BookResponse> getBooks(@PathVariable Long id) {
        return authorService.getBooks(id);
    }
}
