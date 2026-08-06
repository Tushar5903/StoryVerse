package com.storyreview.service.impl;

import com.storyreview.dto.response.ApiResponses.BookProgressResponse;
import com.storyreview.dto.response.ApiResponses.ProgressResponse;
import com.storyreview.entity.Book;
import com.storyreview.entity.Chapter;
import com.storyreview.entity.ReadingProgress;
import com.storyreview.entity.User;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ChapterRepository;
import com.storyreview.repository.ReadingProgressRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.service.ProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProgressServiceImpl implements ProgressService {
    private final ReadingProgressRepository progressRepo;
    private final ChapterRepository chapterRepo;
    private final BookRepository bookRepo;
    private final UserRepository userRepo;

    public ProgressServiceImpl(ReadingProgressRepository progressRepo, ChapterRepository chapterRepo,
                               BookRepository bookRepo, UserRepository userRepo) {
        this.progressRepo = progressRepo;
        this.chapterRepo = chapterRepo;
        this.bookRepo = bookRepo;
        this.userRepo = userRepo;
    }

    @Override
    @Transactional
    public void markRead(Long userId, Long bookId, Long chapterId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        Chapter chapter = chapterRepo.findById(chapterId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Chapter not found"));
        if (!chapter.getBook().getId().equals(bookId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chapter does not belong to the book");
        }
        if (progressRepo.findByUserIdAndChapterId(userId, chapterId).isPresent()) {
            return;
        }
        ReadingProgress progress = new ReadingProgress();
        progress.setUser(user);
        progress.setBook(chapter.getBook());
        progress.setChapter(chapter);
        progressRepo.save(progress);
    }

    @Override
    @Transactional
    public void unmarkRead(Long userId, Long chapterId) {
        progressRepo.deleteByUserIdAndChapterId(userId, chapterId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookProgressResponse> getProgress(Long userId) {
        List<ReadingProgress> rows = progressRepo.findByUserIdOrderByUpdatedAtDesc(userId);
        Map<Long, List<ReadingProgress>> byBook = new LinkedHashMap<>();
        for (ReadingProgress row : rows) {
            byBook.computeIfAbsent(row.getBook().getId(), k -> new ArrayList<>()).add(row);
        }
        List<BookProgressResponse> result = new ArrayList<>();
        for (Map.Entry<Long, List<ReadingProgress>> entry : byBook.entrySet()) {
            Book book = bookRepo.findById(entry.getKey()).orElse(null);
            if (book == null || !isVisible(book, userId)) {
                continue;
            }
            List<ProgressResponse> chapters = entry.getValue().stream()
                    .sorted(Comparator.comparingInt(r -> r.getChapter().getChapterNumber()))
                    .map(r -> new ProgressResponse(r.getBook().getId(), r.getChapter().getId(), r.getUpdatedAt()))
                    .toList();
            result.add(new BookProgressResponse(book.getId(), book.getTitle(), book.getCoverImage(),
                    book.getThumbnailUrl(), book.getGenres().isEmpty() ? null : book.getGenres().iterator().next(),
                    book.getAuthor().getName(),
                    chapterRepo.countByBookId(book.getId()), chapters));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getBookProgress(Long userId, Long bookId) {
        return progressRepo.findByUserIdAndBookId(userId, bookId).stream()
                .sorted(Comparator.comparingInt(r -> r.getChapter().getChapterNumber()))
                .map(r -> new ProgressResponse(r.getBook().getId(), r.getChapter().getId(), r.getUpdatedAt()))
                .toList();
    }

    private boolean isVisible(Book book, Long userId) {
        return book.isPublished() || book.getCreatedBy().getId().equals(userId);
    }
}
