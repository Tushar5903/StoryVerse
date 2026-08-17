package com.storyreview.service;

import com.storyreview.dto.request.AuthorRequests.CreateAuthorRequest;
import com.storyreview.dto.request.AuthorRequests.UpdateAuthorRequest;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuthorService {
    AuthorResponse create(CreateAuthorRequest request);
    AuthorResponse update(Long id, UpdateAuthorRequest request, CurrentUser currentUser);
    AuthorResponse getById(Long id);
    Page<AuthorResponse> getAll(Pageable pageable);
    Page<BookResponse> getBooks(Long authorId, Pageable pageable);
}
