package com.storyreview.service;

import com.storyreview.dto.request.ReviewRequests.CreateReviewRequest;
import com.storyreview.dto.request.ReviewRequests.UpdateReviewRequest;
import com.storyreview.dto.response.ApiResponses.ReviewResponse;
import com.storyreview.enums.ReviewVerdict;
import com.storyreview.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse create(CreateReviewRequest request, Long userId, Role role);
    ReviewResponse update(Long id, UpdateReviewRequest request, Long userId, Role role);
    void delete(Long id, Long userId, Role role);
    ReviewResponse getById(Long id);
    Page<ReviewResponse> getByBookId(Long bookId, ReviewVerdict verdict, Long requesterId, Role requesterRole, Pageable pageable);
    Page<ReviewResponse> getByUserId(Long userId, Pageable pageable);
    Page<ReviewResponse> getByUserIdPublic(Long userId, Pageable pageable);
    Page<ReviewResponse> getFeed(Pageable pageable);

    /**
     * The current user's review for one book, or 404. The book page uses this to show the
     * "Your Review" card even when the review sits beyond the first page of reviews.
     */
    ReviewResponse getMineForBook(Long userId, Long bookId);
}
