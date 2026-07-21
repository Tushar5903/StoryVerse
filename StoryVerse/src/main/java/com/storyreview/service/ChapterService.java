package com.storyreview.service;

import com.storyreview.dto.request.ChapterRequests.CreateChapterRequest;
import com.storyreview.dto.request.ChapterRequests.UpdateChapterRequest;
import com.storyreview.dto.response.ApiResponses.ChapterResponse;
import com.storyreview.enums.Role;

import java.util.List;

public interface ChapterService {
    ChapterResponse create(Long bookId, CreateChapterRequest request, Long userId, Role role);
    ChapterResponse update(Long chapterId, UpdateChapterRequest request, Long userId, Role role);
    void delete(Long chapterId, Long userId, Role role);
    ChapterResponse getById(Long chapterId);
    List<ChapterResponse> getByBookId(Long bookId);
}
