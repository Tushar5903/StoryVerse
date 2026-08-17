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
import java.util.stream.Collectors;

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
        // Draft chapters are not publicly readable, so their content can't be marked as read.
        if (!chapter.getBook().isPublished() && !chapter.getBook().getCreatedBy().getId().equals(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Book not found");
        }
        if (progressRepo.findByUserIdAndChapterId(userId, chapterId).isPresent()) {
            return;
        }
        ReadingProgress progress = new ReadingProgress();
        progress.setUser(user);
        progress.setBook(chapter.getBook());
        progress.setChapter(chapter);
        try {
            progressRepo.save(progress);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // The pre-check above is not atomic - a concurrent request (e.g. the frontend
            // 401-retry re-firing the same POST) can hit uk_reading_progress_user_chapter.
            // The row exists now, so this is a successful no-op, not a 500.
        }
    }

    @Override
    @Transactional
    public void unmarkRead(Long userId, Long chapterId) {
        progressRepo.deleteByUserIdAndChapterId(userId, chapterId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookProgressResponse> getProgress(Long userId) {
        // EntityGraph on the repository fetch joins book + chapter with the rows (1 query).
        List<ReadingProgress> rows = progressRepo.findByUserIdOrderByUpdatedAtDesc(userId);
        Map<Long, List<ReadingProgress>> byBook = new LinkedHashMap<>();
        for (ReadingProgress row : rows) {
            byBook.computeIfAbsent(row.getBook().getId(), k -> new ArrayList<>()).add(row);
        }
        if (byBook.isEmpty()) {
            return List.of();
        }
        // One IN query for all books (author + genres fetch-joined) instead of findById per book.
        Map<Long, Book> booksById = bookRepo.findDetailsByIds(byBook.keySet()).stream()
                .collect(Collectors.toMap(Book::getId, b -> b));
        // One GROUP BY count over all book ids instead of countByBookId per book.
        Map<Long, Long> chapterCounts = chapterRepo.countByBookIds(byBook.keySet()).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        List<BookProgressResponse> result = new ArrayList<>();
        for (Map.Entry<Long, List<ReadingProgress>> entry : byBook.entrySet()) {
            Book book = booksById.get(entry.getKey());
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
                    chapterCounts.getOrDefault(book.getId(), 0L), chapters));
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
