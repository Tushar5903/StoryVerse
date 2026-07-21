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
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/review", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    BookResponse createReviewBookWithThumbnail(@RequestPart("request") @Valid CreateReviewBookRequest request,
                                               @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
                                               @AuthenticationPrincipal CurrentUser user) {
        return bookService.createReviewBook(request, thumbnail, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse createDraft(@Valid @RequestBody CreateDraftBookRequest request,
                             @AuthenticationPrincipal CurrentUser user) {
        return bookService.createDraft(request, user.id());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse createDraftWithThumbnail(@RequestPart("request") @Valid CreateDraftBookRequest request,
                                           @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
                                           @AuthenticationPrincipal CurrentUser user) {
        return bookService.createDraft(request, thumbnail, user.id());
    }

    @PutMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse completeDetails(@PathVariable Long id, @Valid @RequestBody CompleteBookDetailsRequest request,
                                 @AuthenticationPrincipal CurrentUser user) {
        return bookService.completeDetails(id, request, user.id(), user.role());
    }

    @PutMapping(value = "/{id}/details", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse completeDetailsWithThumbnail(@PathVariable Long id,
                                               @RequestPart("request") @Valid CompleteBookDetailsRequest request,
                                               @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
                                               @AuthenticationPrincipal CurrentUser user) {
        return bookService.completeDetails(id, request, thumbnail, user.id(), user.role());
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

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    BookResponse updateWithThumbnail(@PathVariable Long id,
                                     @RequestPart("request") @Valid UpdateBookRequest request,
                                     @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
                                     @AuthenticationPrincipal CurrentUser user) {
        return bookService.update(id, request, thumbnail, user.id(), user.role());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void delete(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        bookService.delete(id, user.id(), user.role());
    }
}
