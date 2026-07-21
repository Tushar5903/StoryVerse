package com.storyreview.service.impl;

import com.storyreview.dto.request.BookRequests.CompleteBookDetailsRequest;
import com.storyreview.dto.request.BookRequests.CreateDraftBookRequest;
import com.storyreview.dto.request.BookRequests.CreateReviewBookRequest;
import com.storyreview.dto.request.BookRequests.UpdateBookRequest;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.entity.Author;
import com.storyreview.entity.Book;
import com.storyreview.entity.User;
import com.storyreview.enums.AuthorType;
import com.storyreview.enums.BookType;
import com.storyreview.enums.Role;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ChapterRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.service.BookService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class BookServiceImpl implements BookService {
    private final BookRepository books;
    private final AuthorRepository authors;
    private final UserRepository users;
    private final ChapterRepository chapters;

    public BookServiceImpl(BookRepository books, AuthorRepository authors, UserRepository users, ChapterRepository chapters) {
        this.books = books;
        this.authors = authors;
        this.users = users;
        this.chapters = chapters;
    }

    @Override
    public BookResponse createReviewBook(CreateReviewBookRequest request, Long adminId) {
        // Admin flow is unchanged: created fully-formed and published immediately.
        validateDuplicateTitle(request.title(), request.authorId(), null);
        Book book = new Book();
        book.setBookType(BookType.REVIEW_BOOK);
        book.setPublished(true);
        applyFields(book, request.title(), request.subtitle(), request.description(), request.coverImage(),
                request.language(), request.genre(), request.tags(), request.publicationDate(), request.authorId());
        book.setCreatedBy(findUser(adminId));
        return toResponse(saveBook(book));
    }

    @Override
    public BookResponse createDraft(CreateDraftBookRequest request, Long userId) {
        // Step 1 of the USER_BOOK flow: only title + author. Everything else, including
        // description, is filled in later via completeDetails() before publish().
        User user = findUser(userId);
        Author author = findOrCreateUserAuthor(user);
        validateDuplicateTitle(request.title(), author.getId(), null);
        Book book = new Book();
        book.setBookType(BookType.USER_BOOK);
        book.setPublished(false);
        book.setTitle(request.title().trim());
        book.setAuthor(author);
        book.setCreatedBy(user);
        return toResponse(saveBook(book));
    }

    @Override
    public BookResponse completeDetails(Long id, CompleteBookDetailsRequest request, Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        book.setDescription(request.description());
        book.setCoverImage(request.coverImage());
        book.setSubtitle(request.subtitle());
        book.setLanguage(request.language());
        book.setGenre(request.genre());
        book.setTags(request.tags() == null ? new HashSet<>() : new HashSet<>(request.tags()));
        book.setPublicationDate(request.publicationDate());
        return toResponse(saveBook(book));
    }

    @Override
    public BookResponse publish(Long id, Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        if (book.isPublished()) {
            throw new ApiException(HttpStatus.CONFLICT, "Book is already published");
        }
        if (book.getDescription() == null || book.getDescription().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Add a description before publishing (see complete-details)");
        }
        // A book with zero chapters isn't readable, so it can't be published.
        if (chapters.countByBookId(id) == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot publish a book with no chapters");
        }
        book.setPublished(true);
        return toResponse(saveBook(book));
    }

    @Override
    public BookResponse update(Long id, UpdateBookRequest request, Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        validateDuplicateTitle(request.title(), request.authorId(), id);
        applyFields(book, request.title(), request.subtitle(), request.description(), request.coverImage(),
                request.language(), request.genre(), request.tags(), request.publicationDate(), request.authorId());
        return toResponse(saveBook(book));
    }

    @Override
    public void delete(Long id, Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        books.delete(book);
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse getById(Long id, Long requesterId, Role requesterRole) {
        Book book = findBook(id);
        // Drafts are only visible to their owner or an admin - never leaked into public reads.
        if (!book.isPublished() && !canView(book, requesterId, requesterRole)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Book not found");
        }
        return toResponse(book);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookResponse> search(String query, Long authorId, String genre, BookType bookType, Pageable pageable) {
        // The public catalog only ever surfaces published (readable) books. Draft books are only
        // visible to their owner (getMine) or an admin (admin endpoints).
        Specification<Book> spec = (root, cq, cb) -> cb.isTrue(root.get("published"));
        if (query != null && !query.isBlank()) {
            String pattern = "%" + query.toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("subtitle")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)));
        }
        if (authorId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("author").get("id"), authorId));
        }
        if (genre != null && !genre.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.equal(cb.lower(root.get("genre")), genre.toLowerCase()));
        }
        if (bookType != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("bookType"), bookType));
        }
        return books.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookResponse> getMine(Long userId, Pageable pageable) {
        return books.findByCreatedById(userId, pageable).map(this::toResponse);
    }

    private void applyFields(Book book, String title, String subtitle, String description, String coverImage,
                             String language, String genre, Set<String> tags,
                             java.time.LocalDate publicationDate, Long authorId) {
        book.setTitle(title.trim());
        book.setSubtitle(subtitle);
        book.setDescription(description);
        book.setCoverImage(coverImage);
        book.setLanguage(language);
        book.setGenre(genre);
        book.setTags(tags == null ? new HashSet<>() : new HashSet<>(tags));
        book.setPublicationDate(publicationDate);
        book.setAuthor(findAuthor(authorId));
    }

    private void validateDuplicateTitle(String title, Long authorId, Long excludeId) {
        boolean exists = excludeId == null
                ? books.existsByTitleIgnoreCaseAndAuthorId(title.trim(), authorId)
                : books.existsByTitleIgnoreCaseAndAuthorIdAndIdNot(title.trim(), authorId, excludeId);
        if (exists) {
            throw new ApiException(HttpStatus.CONFLICT, "A book with this title already exists for the author");
        }
    }

    private boolean canView(Book book, Long requesterId, Role requesterRole) {
        return requesterRole == Role.ADMIN || (requesterId != null && book.getCreatedBy().getId().equals(requesterId));
    }

    /**
     * REVIEW_BOOK: only ROLE_ADMIN may modify.
     * USER_BOOK: the creator, or ROLE_ADMIN (ownership override), may modify.
     */
    private void assertCanModify(Book book, Long userId, Role role) {
        if (role == Role.ADMIN) {
            return;
        }
        if (book.getBookType() == BookType.USER_BOOK && book.getCreatedBy().getId().equals(userId)) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to modify this book");
    }

    private Book findBook(Long id) {
        return books.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private Author findAuthor(Long id) {
        return authors.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Author not found"));
    }

    private Author findOrCreateUserAuthor(User user) {
        return authors.findByUserId(user.getId()).orElseGet(() -> {
            Author author = new Author();
            author.setName(user.getName());
            author.setBiography(user.getBio());
            author.setProfileImage(user.getProfileImage());
            author.setAuthorType(AuthorType.USER);
            author.setUser(user);
            return authors.save(author);
        });
    }

    private User findUser(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Book saveBook(Book book) {
        try {
            return books.save(book);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "A book with this title already exists for the author");
        }
    }

    private BookResponse toResponse(Book book) {
        return new BookResponse(book.getId(), book.getTitle(), book.getSubtitle(), book.getDescription(),
                book.getCoverImage(), book.getBookType(), book.isPublished(), book.getLanguage(), book.getGenre(),
                book.getTags(), book.getPublicationDate(), book.getCreatedBy().getId(), book.getAuthor().getId(),
                book.getAuthor().getName(), book.getCreatedAt(), book.getUpdatedAt());
    }
}
