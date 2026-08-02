package com.storyreview.service;

import com.storyreview.dto.request.ReviewRequests.CreateReviewRequest;
import com.storyreview.dto.request.ReviewRequests.UpdateReviewRequest;
import com.storyreview.dto.response.ApiResponses.ReviewResponse;
import com.storyreview.enums.Role;
import com.storyreview.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse create(CreateReviewRequest request, Long userId, Role role);
    ReviewResponse update(Long id, UpdateReviewRequest request, Long userId, Role role);
    void delete(Long id, Long userId, Role role);
    ReviewResponse getById(Long id);
    Page<ReviewResponse> getByBookId(Long bookId, Long requesterId, Role requesterRole, Pageable pageable);
    Page<ReviewResponse> getByUserId(Long userId, Pageable pageable);
    Page<ReviewResponse> getByUserIdPublic(Long userId, Pageable pageable);
    Page<ReviewResponse> getFeed(Pageable pageable);
}
