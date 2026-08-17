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
import com.storyreview.util.HtmlSanitizer;
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
        chapter.setChapterContent(HtmlSanitizer.clean(request.chapterContent()));
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
        chapter.setChapterContent(HtmlSanitizer.clean(request.chapterContent()));
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
        chapter.setChapterContent(HtmlSanitizer.clean(request.chapterContent()));
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
    public ChapterResponse getById(Long chapterId, Long requesterId, Role requesterRole) {
        Chapter chapter = findChapter(chapterId);
        assertReadable(chapter.getBook(), requesterId, requesterRole);
        return toResponse(chapter);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getById(Long bookId, Long chapterId, Long requesterId, Role requesterRole) {
        Book book = findBook(bookId);
        assertReadable(book, requesterId, requesterRole);
        return toResponse(findChapterForBook(bookId, chapterId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChapterResponse> getByBookId(Long bookId, Long requesterId, Role requesterRole) {
        Book book = findBook(bookId);
        assertReadable(book, requesterId, requesterRole);
        // The chapter list is a meta-only table of contents for EVERYONE (id/number/title).
        // The writer studio fetches a chapter's body on demand (GET .../chapters/{id}) when
        // it is opened in the editor, so a long book never ships megabytes of content in the
        // list response. Owners/admins additionally get word counts for the studio rows.
        boolean details = requesterRole == Role.ADMIN
                || (requesterId != null && book.getCreatedBy().getId().equals(requesterId));
        return chapters.findByBookIdOrderByChapterNumberAsc(bookId).stream()
                .map(chapter -> toResponse(chapter, details))
                .toList();
    }

    /**
     * Chapters of published books are public. Draft chapters are only visible to the owner or an admin.
     */
    private void assertReadable(Book book, Long requesterId, Role requesterRole) {
        if (book.isPublished()) {
            return;
        }
        if (requesterRole == Role.ADMIN || (requesterId != null && book.getCreatedBy().getId().equals(requesterId))) {
            return;
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "Book not found");
    }

    private Book findBook(Long bookId) {
        return books.findById(bookId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    /**
     * Review books (created for an author profile) are published as a single work without chapters.
     * Only the creator of a story book, or a user with ROLE_ADMIN, may create/update/delete chapters.
     * All other authenticated users are read-only (enforced separately via @PreAuthorize on GET endpoints).
     */
    private void assertCanManage(Book book, Long userId, Role role) {
        if (book.getBookType() == BookType.REVIEW_BOOK) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Review books do not support chapters");
        }
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
        return toResponse(chapter, true);
    }

    private static final java.util.regex.Pattern TAG_STRIP = java.util.regex.Pattern.compile("<[^>]*>");

    private static Long plainWordsOf(String html) {
        if (html == null || html.isBlank()) {
            return 0L;
        }
        String text = TAG_STRIP.matcher(html).replaceAll(" ").trim();
        return text.isEmpty() ? 0L : (long) text.split("\\s+").length;
    }

    private ChapterResponse toResponse(Chapter chapter, boolean includeDetails) {
        String content = includeDetails ? chapter.getChapterContent() : null;
        Long wordCount = includeDetails ? plainWordsOf(chapter.getChapterContent()) : null;
        return new ChapterResponse(chapter.getId(), chapter.getBook().getId(), chapter.getChapterNumber(),
                chapter.getChapterTitle(), content, wordCount,
                chapter.getCreatedAt(), chapter.getUpdatedAt());
    }
}
