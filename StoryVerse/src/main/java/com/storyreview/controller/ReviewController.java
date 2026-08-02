package com.storyreview.controller;

import com.storyreview.dto.request.ReviewRequests.CreateReviewRequest;
import com.storyreview.dto.request.ReviewRequests.UpdateReviewRequest;
import com.storyreview.dto.response.ApiResponses.ReviewResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ReviewResponse create(@Valid @RequestBody CreateReviewRequest request,
                          @AuthenticationPrincipal CurrentUser user) {
        return reviewService.create(request, user.id(), user.role());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ReviewResponse update(@PathVariable Long id, @Valid @RequestBody UpdateReviewRequest request,
                          @AuthenticationPrincipal CurrentUser user) {
        return reviewService.update(id, request, user.id(), user.role());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void delete(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        reviewService.delete(id, user.id(), user.role());
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    Page<ReviewResponse> getMine(@AuthenticationPrincipal CurrentUser user, Pageable pageable) {
        return reviewService.getByUserId(user.id(), pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ReviewResponse getById(@PathVariable Long id) {
        return reviewService.getById(id);
    }

    @GetMapping
    Page<ReviewResponse> getByBookOrUser(@RequestParam(required = false) Long bookId,
                                         @RequestParam(required = false) Long userId,
                                         @AuthenticationPrincipal CurrentUser user, Pageable pageable) {
        if (userId != null) {
            return reviewService.getByUserIdPublic(userId, pageable);
        }
        if (bookId != null) {
            return reviewService.getByBookId(bookId, user == null ? null : user.id(),
                    user == null ? null : user.role(), pageable);
        }
        return reviewService.getFeed(pageable);
    }
}
