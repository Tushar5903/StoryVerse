package com.storyreview.service;

import com.storyreview.dto.request.BookRequests.CompleteBookDetailsRequest;
import com.storyreview.dto.request.BookRequests.CreateDraftBookRequest;
import com.storyreview.dto.request.BookRequests.CreateReviewBookRequest;
import com.storyreview.dto.request.BookRequests.UpdateBookRequest;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.enums.BookType;
import com.storyreview.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookService {
    BookResponse createReviewBook(CreateReviewBookRequest request, Long adminId);
    BookResponse createDraft(CreateDraftBookRequest request, Long userId);
    BookResponse completeDetails(Long id, CompleteBookDetailsRequest request, Long userId, Role role);
    BookResponse publish(Long id, Long userId, Role role);
    BookResponse update(Long id, UpdateBookRequest request, Long userId, Role role);
    void delete(Long id, Long userId, Role role);
    BookResponse getById(Long id, Long requesterId, Role requesterRole);
    Page<BookResponse> search(String query, Long authorId, String genre, BookType bookType, Pageable pageable);
    Page<BookResponse> getMine(Long userId, Pageable pageable);
}
