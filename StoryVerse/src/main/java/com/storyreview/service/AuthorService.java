package com.storyreview.service;

import com.storyreview.dto.request.AuthorRequests.CreateAuthorRequest;
import com.storyreview.dto.request.AuthorRequests.UpdateAuthorRequest;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AuthorService {
    AuthorResponse create(CreateAuthorRequest request);
    AuthorResponse update(Long id, UpdateAuthorRequest request);
    AuthorResponse getById(Long id);
    Page<AuthorResponse> getAll(Pageable pageable);
    List<BookResponse> getBooks(Long authorId);
}
