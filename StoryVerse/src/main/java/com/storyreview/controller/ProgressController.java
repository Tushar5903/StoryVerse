package com.storyreview.controller;

import com.storyreview.dto.request.ProgressRequests.MarkReadRequest;
import com.storyreview.dto.response.ApiResponses.BookProgressResponse;
import com.storyreview.dto.response.ApiResponses.ProgressResponse;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.ProgressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void markRead(@Valid @RequestBody MarkReadRequest request,
                  @AuthenticationPrincipal CurrentUser user) {
        progressService.markRead(user.id(), request.bookId(), request.chapterId());
    }

    @DeleteMapping("/{chapterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    void unmarkRead(@PathVariable Long chapterId,
                    @AuthenticationPrincipal CurrentUser user) {
        progressService.unmarkRead(user.id(), chapterId);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    List<BookProgressResponse> getProgress(@AuthenticationPrincipal CurrentUser user) {
        return progressService.getProgress(user.id());
    }

    @GetMapping("/book/{bookId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    List<ProgressResponse> getBookProgress(@PathVariable Long bookId,
                                           @AuthenticationPrincipal CurrentUser user) {
        return progressService.getBookProgress(user.id(), bookId);
    }
}
