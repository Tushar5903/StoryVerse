package com.storyreview.service.impl;

import com.storyreview.dto.request.ChapterRequests.CreateChapterRequest;
import com.storyreview.dto.request.ChapterRequests.UpdateChapterRequest;
import com.storyreview.dto.response.ApiResponses.ChapterResponse;
import com.storyreview.entity.Book;
import com.storyreview.entity.Chapter;
import com.storyreview.enums.BookType;
import com.storyreview.enums.Role;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ChapterRepository;
import com.storyreview.service.ChapterService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ChapterServiceImpl implements ChapterService {
    private final ChapterRepository chapters;
    private final BookRepository books;

    public ChapterServiceImpl(ChapterRepository chapters, BookRepository books) {
        this.chapters = chapters;
        this.books = books;
    }

    @Override
    public ChapterResponse create(Long bookId, CreateChapterRequest request, Long userId, Role role) {
        Book book = findBook(bookId);
        assertCanManage(book, userId, role);
        if (chapters.existsByBookIdAndChapterNumber(bookId, request.chapterNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chapter number already exists for this book");
        }
        Chapter chapter = new Chapter();
        chapter.setBook(book);
        chapter.setChapterNumber(request.chapterNumber());
        chapter.setChapterTitle(request.chapterTitle());
        chapter.setChapterContent(request.chapterContent());
        return toResponse(saveChapter(chapter));
    }

    @Override
    public ChapterResponse update(Long chapterId, UpdateChapterRequest request, Long userId, Role role) {
        Chapter chapter = findChapter(chapterId);
        assertCanManage(chapter.getBook(), userId, role);
        if (chapters.existsByBookIdAndChapterNumberAndIdNot(chapter.getBook().getId(), request.chapterNumber(), chapterId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Chapter number already exists for this book");
        }
        chapter.setChapterNumber(request.chapterNumber());
        chapter.setChapterTitle(request.chapterTitle());
        chapter.setChapterContent(request.chapterContent());
        return toResponse(saveChapter(chapter));
    }

    @Override
    public ChapterResponse update(Long bookId, Long chapterId, UpdateChapterRequest request, Long userId, Role role) {
        Chapter chapter = findChapterForBook(bookId, chapterId);
        assertCanManage(chapter.getBook(), userId, role);
        if (chapters.existsByBookIdAndChapterNumberAndIdNot(bookId, request.chapterNumber(), chapterId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Chapter number already exists for this book");
        }
        chapter.setChapterNumber(request.chapterNumber());
        chapter.setChapterTitle(request.chapterTitle());
        chapter.setChapterContent(request.chapterContent());
        return toResponse(saveChapter(chapter));
    }

    @Override
    public void delete(Long chapterId, Long userId, Role role) {
        Chapter chapter = findChapter(chapterId);
        assertCanManage(chapter.getBook(), userId, role);
        chapters.delete(chapter);
    }

    @Override
    public void delete(Long bookId, Long chapterId, Long userId, Role role) {
        Chapter chapter = findChapterForBook(bookId, chapterId);
        assertCanManage(chapter.getBook(), userId, role);
        chapters.delete(chapter);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getById(Long chapterId) {
        return toResponse(findChapter(chapterId));
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getById(Long bookId, Long chapterId) {
        return toResponse(findChapterForBook(bookId, chapterId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChapterResponse> getByBookId(Long bookId) {
        if (!books.existsById(bookId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Book not found");
        }
        return chapters.findByBookIdOrderByChapterNumberAsc(bookId).stream().map(this::toResponse).toList();
    }

    private Book findBook(Long bookId) {
        return books.findById(bookId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    /**
     * Only the creator of the book, or a user with ROLE_ADMIN, may create/update/delete chapters.
     * All other authenticated users are read-only (enforced separately via @PreAuthorize on GET endpoints).
     */
    private void assertCanManage(Book book, Long userId, Role role) {
        if (role == Role.ADMIN) {
            return;
        }
        if (!book.getCreatedBy().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the book owner can manage chapters");
        }
    }

    private Chapter findChapter(Long id) {
        return chapters.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Chapter not found"));
    }

    private Chapter findChapterForBook(Long bookId, Long chapterId) {
        Chapter chapter = findChapter(chapterId);
        if (!chapter.getBook().getId().equals(bookId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Chapter not found for this book");
        }
        return chapter;
    }

    private Chapter saveChapter(Chapter chapter) {
        try {
            return chapters.save(chapter);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "Chapter number already exists for this book");
        }
    }

    private ChapterResponse toResponse(Chapter chapter) {
        return new ChapterResponse(chapter.getId(), chapter.getBook().getId(), chapter.getChapterNumber(),
                chapter.getChapterTitle(), chapter.getChapterContent(), chapter.getCreatedAt(), chapter.getUpdatedAt());
    }
}
