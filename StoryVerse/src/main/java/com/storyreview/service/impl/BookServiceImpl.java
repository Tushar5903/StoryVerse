package com.storyreview.service.impl;

import com.storyreview.dto.request.BookRequests.CompleteBookDetailsRequest;
import com.storyreview.dto.request.BookRequests.CreateDraftBookRequest;
import com.storyreview.dto.request.BookRequests.CreateReviewBookRequest;
import com.storyreview.dto.request.BookRequests.UpdateBookRequest;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.dto.response.ApiResponses.LeaderboardEntry;
import com.storyreview.entity.Author;
import com.storyreview.entity.Book;
import com.storyreview.entity.User;
import com.storyreview.enums.AuthorType;
import com.storyreview.enums.BookGenre;
import com.storyreview.enums.BookType;
import com.storyreview.enums.Role;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ChapterRepository;
import com.storyreview.repository.ReviewRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.service.BookService;
import com.storyreview.service.CloudinaryService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookServiceImpl implements BookService {
    private final BookRepository books;
    private final AuthorRepository authors;
    private final UserRepository users;
    private final ChapterRepository chapters;
    private final ReviewRepository reviews;
    private final CloudinaryService cloudinary;

    public BookServiceImpl(BookRepository books, AuthorRepository authors, UserRepository users, ChapterRepository chapters,
                           ReviewRepository reviews, CloudinaryService cloudinary) {
        this.books = books;
        this.authors = authors;
        this.users = users;
        this.chapters = chapters;
        this.reviews = reviews;
        this.cloudinary = cloudinary;
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public BookResponse createReviewBook(CreateReviewBookRequest request, Long adminId) {
        return createReviewBook(request, null, adminId);
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public BookResponse createReviewBook(CreateReviewBookRequest request, MultipartFile thumbnail, Long adminId) {
        // Admin flow is unchanged: created fully-formed and published immediately.
        validateDuplicateTitle(request.title(), request.authorId(), null);
        Book book = new Book();
        book.setBookType(BookType.REVIEW_BOOK);
        book.setPublished(true);
        applyFields(book, request.title(), request.subtitle(), request.description(), request.coverImage(),
                request.language(), request.genres(), request.tags(), request.publicationDate(), request.authorId(),
                thumbnail == null || thumbnail.isEmpty() ? null : cloudinaryUpload(thumbnail));
        book.setCreatedBy(findUser(adminId));
        return toResponse(saveBook(book));
    }

    @Override
    public BookResponse createDraft(CreateDraftBookRequest request, Long userId) {
        return createDraft(request, null, userId);
    }

    @Override
    public BookResponse createDraft(CreateDraftBookRequest request, MultipartFile thumbnail, Long userId) {
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
        if (thumbnail != null && !thumbnail.isEmpty()) {
            book.setThumbnailUrl(cloudinaryUpload(thumbnail));
        }
        return toResponse(saveBook(book));
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public BookResponse completeDetails(Long id, CompleteBookDetailsRequest request, Long userId, Role role) {
        return completeDetails(id, request, null, userId, role);
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public BookResponse completeDetails(Long id, CompleteBookDetailsRequest request, MultipartFile thumbnail,
                                        Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        book.setDescription(request.description());
        book.setCoverImage(request.coverImage());
        book.setSubtitle(request.subtitle());
        book.setLanguage(request.language());
        book.setGenres(BookGenre.normalizeAll(request.genres()));
        book.setTags(request.tags() == null ? new HashSet<>() : new HashSet<>(request.tags()));
        book.setPublicationDate(request.publicationDate());
        if (thumbnail != null && !thumbnail.isEmpty()) {
            book.setThumbnailUrl(cloudinaryUpload(thumbnail));
        }
        return toResponse(saveBook(book));
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
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
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public BookResponse update(Long id, UpdateBookRequest request, Long userId, Role role) {
        return update(id, request, null, userId, role);
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public BookResponse update(Long id, UpdateBookRequest request, MultipartFile thumbnail, Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        // A user may only attach their story to their own user-linked author profile.
        // Admins (REVIEW_BOOK and ownership overrides) may point a book at any author.
        // Null authorId (legacy USER_BOOKs, frontend never sends 0) keeps the current author.
        Long targetAuthorId = request.authorId();
        if (targetAuthorId == null) {
            targetAuthorId = book.getAuthor().getId();
        } else if (role != Role.ADMIN && !targetAuthorId.equals(book.getAuthor().getId())) {
            Author target = findAuthor(targetAuthorId);
            if (target.getUser() == null || !target.getUser().getId().equals(userId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You can only attach your book to your own author profile");
            }
        }
        validateDuplicateTitle(request.title(), targetAuthorId, id);
        applyFields(book, request.title(), request.subtitle(), request.description(), request.coverImage(),
                request.language(), request.genres(), request.tags(), request.publicationDate(), targetAuthorId,
                thumbnail == null || thumbnail.isEmpty() ? null : cloudinaryUpload(thumbnail));
        return toResponse(saveBook(book));
    }

    @Override
    @CacheEvict(cacheNames = "bookCatalog", allEntries = true)
    public void delete(Long id, Long userId, Role role) {
        Book book = findBook(id);
        assertCanModify(book, userId, role);
        // Drop the Cloudinary cover before the row - reviews/reading progress are
        // removed by the ON DELETE CASCADE from V12__cascade_delete.sql.
        cloudinary.deleteImage(book.getThumbnailUrl());
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
    @Cacheable(cacheNames = "bookCatalog",
            key = "{#query, #authorId, #genre, #bookType, #pageable.pageNumber, #pageable.pageSize, #pageable.sort}")
    public Page<BookResponse> search(String query, Long authorId, String genre, BookType bookType, Pageable pageable) {
        // The public catalog only ever surfaces published (readable) books. Draft books are only
        // visible to their owner (getMine) or an admin (admin endpoints).
        Specification<Book> spec = (root, cq, cb) -> cb.isTrue(root.get("published"));
        if (query != null && !query.isBlank()) {
            String term = query.trim();
            // Long queries ride the MySQL FULLTEXT index (V11) instead of a leading-wildcard
            // LIKE scan. Boolean mode: strip operator characters, add a per-word prefix `*`.
            boolean fulltextMatched = false;
            if (term.length() >= 4) {
                String fulltext = java.util.Arrays.stream(term.toLowerCase().split("\\s+"))
                        .map(word -> word.replaceAll("[+\\-<>\\(\\)~@\"*]", ""))
                        .filter(word -> !word.isBlank())
                        .map(word -> word + "*")
                        .collect(Collectors.joining(" "));
                if (!fulltext.isBlank()) {
                    List<Long> ids = books.findIdsByFulltext(fulltext);
                    // MySQL silently drops stopwords and words shorter than ft_min_word_len,
                    // so an empty result is NOT proof of no matches - fall through to LIKE.
                    if (!ids.isEmpty()) {
                        spec = spec.and((root, cq, cb) -> root.get("id").in(ids));
                        fulltextMatched = true;
                    }
                }
            }
            // Short queries (< 4 chars) and stopword-only phrases fall back to the escaped
            // LIKE (the FULLTEXT index can't help anyway). Escape LIKE wildcards (% and _)
            // and the escape char itself so user input is matched literally instead of
            // acting as a pattern.
            if (!fulltextMatched) {
                String escaped = term.toLowerCase()
                        .replace("!", "!!")
                        .replace("%", "!%")
                        .replace("_", "!_");
                String pattern = "%" + escaped + "%";
                spec = spec.and((root, cq, cb) -> cb.or(
                        cb.like(cb.lower(root.get("title")), pattern, '!'),
                        cb.like(cb.lower(root.get("subtitle")), pattern, '!'),
                        cb.like(cb.lower(root.get("description")), pattern, '!')));
            }
        }
        if (authorId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("author").get("id"), authorId));
        }
        if (genre != null && !genre.isBlank()) {
            // Match books that carry the requested genre among their (possibly several) genres.
            // Unknown values fall through to an exact match, which simply yields no results.
            String normalized;
            try {
                normalized = BookGenre.normalize(genre);
            } catch (ApiException ignored) {
                normalized = genre;
            }
            String match = normalized;
            spec = spec.and((root, cq, cb) -> cb.isMember(match, root.get("genres")));
        }
        if (bookType != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("bookType"), bookType));
        }
        return toResponsesWithCount(books.findAll(spec, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookResponse> getMine(Long userId, Pageable pageable) {
        return toResponsesWithCount(books.findByCreatedById(userId, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "bookCatalog", key = "{'leaderboard', #limit}")
    public List<LeaderboardEntry> leaderboard(int limit) {
        int capped = Math.min(Math.max(limit, 1), 100);
        // Candidate pool: the newest published books. One aggregate query returns the
        // exact per-verdict counts for the whole pool - no per-book review requests,
        // no review bodies crossing the wire (the old leaderboard fetched up to 100
        // review pages and shipped every verdict's full content).
        Page<Book> pool = books.findAll(
                (root, cq, cb) -> cb.isTrue(root.get("published")),
                org.springframework.data.domain.PageRequest.of(0, capped,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
        if (pool.isEmpty()) {
            return List.of();
        }
        List<Long> ids = pool.getContent().stream().map(Book::getId).toList();
        Map<Long, Long> totals = reviews.countByBookIds(ids)
                .stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, Map<String, Long>> verdicts = new HashMap<>();
        for (Object[] row : reviews.countByBookIdsAndVerdict(ids)) {
            verdicts.computeIfAbsent((Long) row[0], key -> new HashMap<>())
                    .put(((com.storyreview.enums.ReviewVerdict) row[1]).name(), (Long) row[2]);
        }
        return pool.getContent().stream()
                .map(book -> new LeaderboardEntry(toResponse(book, totals.getOrDefault(book.getId(), 0L)),
                        totals.getOrDefault(book.getId(), 0L),
                        verdicts.getOrDefault(book.getId(), Map.of())))
                .toList();
    }

    private void applyFields(Book book, String title, String subtitle, String description, String coverImage,
                             String language, Set<String> genres, Set<String> tags,
                             java.time.LocalDate publicationDate, Long authorId, String thumbnailUrl) {
        book.setTitle(title.trim());
        book.setSubtitle(subtitle);
        book.setDescription(description);
        book.setCoverImage(coverImage);
        book.setLanguage(language);
        book.setGenres(BookGenre.normalizeAll(genres));
        book.setTags(tags == null ? new HashSet<>() : new HashSet<>(tags));
        book.setPublicationDate(publicationDate);
        book.setAuthor(findAuthor(authorId));
        if (thumbnailUrl != null) {
            book.setThumbnailUrl(thumbnailUrl);
        }
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
            try {
                return authors.save(author);
            } catch (DataIntegrityViolationException ex) {
                // Two concurrent draft creations can both miss findByUserId and both try
                // to insert - the second hits uk_authors_user_id. The author exists now,
                // so re-fetch instead of failing the request with a 500.
                return authors.findByUserId(user.getId())
                        .orElseThrow(() -> ex);
            }
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

    // Batch review counts: ONE GROUP BY query for the whole page instead of a COUNT per book.
    private Page<BookResponse> toResponsesWithCount(Page<Book> page) {
        List<Book> content = page.getContent();
        if (content.isEmpty()) {
            return page.map(this::toResponseWithCount);
        }
        Map<Long, Long> counts = reviews.countByBookIds(content.stream().map(Book::getId).toList())
                .stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        return page.map(book -> toResponse(book, counts.getOrDefault(book.getId(), 0L)));
    }

    private BookResponse toResponseWithCount(Book book) {
        return toResponse(book, reviews.countByBookId(book.getId()));
    }

    private BookResponse toResponse(Book book) {
        return toResponseWithCount(book);
    }

    // Materialize lazy collections at the DTO boundary (SUBSELECT loads them inside the
    // transaction; the uninitialized reference must never leak into a response record).
    private static Set<String> copyOf(Set<String> values) {
        return values == null ? Set.of() : new HashSet<>(values);
    }

    private BookResponse toResponse(Book book, long reviewCount) {
        Set<String> genres = copyOf(book.getGenres());
        String primaryGenre = genres.isEmpty() ? null : genres.iterator().next();
        return new BookResponse(book.getId(), book.getTitle(), book.getSubtitle(), book.getDescription(),
                book.getCoverImage(), book.getThumbnailUrl(), book.getBookType(), book.isPublished(), book.getLanguage(),
                primaryGenre, genres,
                copyOf(book.getTags()), book.getPublicationDate(), book.getCreatedBy().getId(), book.getAuthor().getId(),
                book.getAuthor().getName(), reviewCount, book.getCreatedAt(), book.getUpdatedAt());
    }

    private String cloudinaryUpload(MultipartFile thumbnail) {
        return cloudinary.uploadBookCover(thumbnail);
    }
}
