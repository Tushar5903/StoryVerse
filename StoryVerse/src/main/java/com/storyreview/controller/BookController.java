package com.storyreview.controller;

import com.storyreview.dto.request.BookRequests.CompleteBookDetailsRequest;
import com.storyreview.dto.request.BookRequests.CreateDraftBookRequest;
import com.storyreview.dto.request.BookRequests.CreateReviewBookRequest;
import com.storyreview.dto.request.BookRequests.UpdateBookRequest;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.enums.BookType;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.BookService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
public class BookController {
    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    Page<BookResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) BookType type,
            Pageable pageable) {
        return bookService.search(q, authorId, genre, type, pageable);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    Page<BookResponse> mine(@AuthenticationPrincipal CurrentUser user, Pageable pageable) {
        return bookService.getMine(user.id(), pageable);
    }

    @GetMapping("/{id}")
    BookResponse getById(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        return bookService.getById(id, user == null ? null : user.id(), user == null ? null : user.role());
    }

    @PostMapping("/review")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    BookResponse createReviewBook(@Valid @RequestBody CreateReviewBookRequest request,
                                  @AuthenticationPrincipal CurrentUser user) {
        return bookService.createReviewBook(request, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse createDraft(@Valid @RequestBody CreateDraftBookRequest request,
                             @AuthenticationPrincipal CurrentUser user) {
        return bookService.createDraft(request, user.id());
    }

    @PutMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse completeDetails(@PathVariable Long id, @Valid @RequestBody CompleteBookDetailsRequest request,
                                 @AuthenticationPrincipal CurrentUser user) {
        return bookService.completeDetails(id, request, user.id(), user.role());
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse publish(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        return bookService.publish(id, user.id(), user.role());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse update(@PathVariable Long id, @Valid @RequestBody UpdateBookRequest request,
                        @AuthenticationPrincipal CurrentUser user) {
        return bookService.update(id, request, user.id(), user.role());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void delete(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        bookService.delete(id, user.id(), user.role());
    }
}
