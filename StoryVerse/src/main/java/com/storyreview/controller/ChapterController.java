package com.storyreview.controller;

import com.storyreview.dto.request.ChapterRequests.CreateChapterRequest;
import com.storyreview.dto.request.ChapterRequests.UpdateChapterRequest;
import com.storyreview.dto.response.ApiResponses.ChapterResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.ChapterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ChapterController {
    private final ChapterService chapterService;

    public ChapterController(ChapterService chapterService) {
        this.chapterService = chapterService;
    }

    @PostMapping("/api/books/{bookId}/chapters")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ChapterResponse create(@PathVariable Long bookId, @Valid @RequestBody CreateChapterRequest request,
                           @AuthenticationPrincipal CurrentUser user) {
        return chapterService.create(bookId, request, user.id(), user.role());
    }

    @GetMapping("/api/books/{bookId}/chapters")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    List<ChapterResponse> getByBook(@PathVariable Long bookId) {
        return chapterService.getByBookId(bookId);
    }

    @GetMapping("/api/books/{bookId}/chapters/{chapterId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ChapterResponse getByBookAndId(@PathVariable Long bookId, @PathVariable Long chapterId) {
        return chapterService.getById(bookId, chapterId);
    }

    @PutMapping("/api/books/{bookId}/chapters/{chapterId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ChapterResponse updateNested(@PathVariable Long bookId, @PathVariable Long chapterId,
                                 @Valid @RequestBody UpdateChapterRequest request,
                                 @AuthenticationPrincipal CurrentUser user) {
        return chapterService.update(bookId, chapterId, request, user.id(), user.role());
    }

    @DeleteMapping("/api/books/{bookId}/chapters/{chapterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void deleteNested(@PathVariable Long bookId, @PathVariable Long chapterId,
                      @AuthenticationPrincipal CurrentUser user) {
        chapterService.delete(bookId, chapterId, user.id(), user.role());
    }

    @GetMapping("/api/chapters/{chapterId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ChapterResponse getById(@PathVariable Long chapterId) {
        return chapterService.getById(chapterId);
    }

    @PutMapping("/api/chapters/{chapterId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ChapterResponse update(@PathVariable Long chapterId, @Valid @RequestBody UpdateChapterRequest request,
                           @AuthenticationPrincipal CurrentUser user) {
        return chapterService.update(chapterId, request, user.id(), user.role());
    }

    @DeleteMapping("/api/chapters/{chapterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void delete(@PathVariable Long chapterId, @AuthenticationPrincipal CurrentUser user) {
        chapterService.delete(chapterId, user.id(), user.role());
    }
}
