package com.storyreview.controller;

import com.storyreview.dto.request.AuthorRequests.CreateAuthorRequest;
import com.storyreview.dto.request.AuthorRequests.UpdateAuthorRequest;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.AuthorService;
import com.storyreview.util.SortSanitizer;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/authors")
public class AuthorController {
    private static final Set<String> AUTHOR_SORTABLE = Set.of("createdAt", "updatedAt", "name");
    private static final Set<String> BOOK_SORTABLE = Set.of("createdAt", "updatedAt", "title", "publicationDate");
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
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    AuthorResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAuthorRequest request,
                          @AuthenticationPrincipal CurrentUser currentUser) {
        return authorService.update(id, request, currentUser);
    }

    @GetMapping
    Page<AuthorResponse> getAll(Pageable pageable) {
        pageable = SortSanitizer.allow(pageable, AUTHOR_SORTABLE);
        return authorService.getAll(pageable);
    }

    @GetMapping("/{id}")
    AuthorResponse getById(@PathVariable Long id) {
        return authorService.getById(id);
    }

    @GetMapping("/{id}/books")
    Page<BookResponse> getBooks(@PathVariable Long id, Pageable pageable) {
        pageable = SortSanitizer.allow(pageable, BOOK_SORTABLE);
        return authorService.getBooks(id, pageable);
    }
}
