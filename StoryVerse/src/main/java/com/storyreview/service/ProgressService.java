package com.storyreview.service;

import com.storyreview.dto.response.ApiResponses.BookProgressResponse;
import com.storyreview.dto.response.ApiResponses.ProgressResponse;

import java.util.List;

public interface ProgressService {
    void markRead(Long userId, Long bookId, Long chapterId);

    void unmarkRead(Long userId, Long chapterId);

    List<BookProgressResponse> getProgress(Long userId);

    List<ProgressResponse> getBookProgress(Long userId, Long bookId);
}
