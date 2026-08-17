package com.storyreview.controller;

import com.storyreview.dto.response.ApiResponses.AdminDashboardResponse;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.dto.response.ApiResponses.UserResponse;
import com.storyreview.entity.Author;
import com.storyreview.entity.Book;
import com.storyreview.entity.User;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ReviewRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.util.SortSanitizer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.criteria.JoinType;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Transactional(readOnly = true)
public class AdminController {
    private static final Set<String> BOOK_SORTABLE = Set.of("createdAt", "updatedAt", "title", "publicationDate");
    private static final Set<String> USER_SORTABLE = Set.of("createdAt", "updatedAt", "username", "name");
    private static final Set<String> AUTHOR_SORTABLE = Set.of("createdAt", "updatedAt", "name");
    private final UserRepository users;
    private final BookRepository books;
    private final ReviewRepository reviews;
    private final AuthorRepository authors;

    public AdminController(UserRepository users, BookRepository books, ReviewRepository reviews, AuthorRepository authors) {
        this.users = users;
        this.books = books;
        this.reviews = reviews;
        this.authors = authors;
    }

    @GetMapping("/dashboard")
    @org.springframework.cache.annotation.Cacheable(cacheNames = "dashboard", key = "'counts'")
    AdminDashboardResponse dashboard() {
        return new AdminDashboardResponse(users.count(), books.count(), reviews.count());
    }

    // All books, including unpublished drafts - the public catalog (GET /api/books) never shows those.
    @GetMapping("/books")
    Page<BookResponse> allBooks(Pageable pageable) {
        pageable = SortSanitizer.allow(pageable, BOOK_SORTABLE);
        Page<Book> page = books.findAll(pageable);
        Map<Long, Long> counts = page.isEmpty() ? Map.of()
                : reviews.countByBookIds(page.getContent().stream().map(Book::getId).toList())
                        .stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        return page.map(b -> toBookResponse(b, counts.getOrDefault(b.getId(), 0L)));
    }

    @GetMapping("/users")
    Page<UserResponse> allUsers(Pageable pageable) {
        pageable = SortSanitizer.allow(pageable, USER_SORTABLE);
        return users.findAll(pageable).map(this::toUserResponse);
    }

    @GetMapping("/authors")
    Page<AuthorResponse> allAuthors(@RequestParam(required = false) String q, Pageable pageable) {
        pageable = SortSanitizer.allow(pageable, AUTHOR_SORTABLE);
        if (q == null || q.isBlank()) {
            return authors.findAll(pageable).map(this::toAuthorResponse);
        }
        // Escaped case-insensitive LIKE over name / place-of-birth / biography and the
        // linked user's username. Pagination still happens at the database level.
        String escaped = q.toLowerCase().replace("!", "!!").replace("%", "!%").replace("_", "!_");
        String pattern = "%" + escaped + "%";
        Specification<Author> spec = (root, cq, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern, '!'),
                cb.like(cb.lower(root.get("placeOfBirth")), pattern, '!'),
                cb.like(cb.lower(root.get("biography")), pattern, '!'),
                cb.like(cb.lower(root.join("user", JoinType.LEFT).get("username")), pattern, '!'));
        return authors.findAll(spec, pageable).map(this::toAuthorResponse);
    }

    // Published books by a specific user.
    @GetMapping("/users/{userId}/books")
    Page<BookResponse> publishedBooksByUser(@PathVariable Long userId, Pageable pageable) {
        pageable = SortSanitizer.allow(pageable, BOOK_SORTABLE);
        Page<Book> page = books.findByCreatedByIdAndPublishedTrue(userId, pageable);
        Map<Long, Long> counts = page.isEmpty() ? Map.of()
                : reviews.countByBookIds(page.getContent().stream().map(Book::getId).toList())
                        .stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        return page.map(b -> toBookResponse(b, counts.getOrDefault(b.getId(), 0L)));
    }

    private BookResponse toBookResponse(Book book, long reviewCount) {
        Set<String> genres = new java.util.HashSet<>(book.getGenres());
        String primaryGenre = genres.isEmpty() ? null : genres.iterator().next();
        return new BookResponse(book.getId(), book.getTitle(), book.getSubtitle(), book.getDescription(),
                book.getCoverImage(), book.getThumbnailUrl(), book.getBookType(), book.isPublished(), book.getLanguage(),
                primaryGenre, genres,
                new java.util.HashSet<>(book.getTags()), book.getPublicationDate(), book.getCreatedBy().getId(),
                book.getAuthor().getId(), book.getAuthor().getName(), reviewCount, book.getCreatedAt(), book.getUpdatedAt());
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(),
                user.getBio(), user.getProfileImage(), user.getDateOfBirth(),
                user.getInstagram(), user.getTwitter(), user.getYoutube(),
                user.getRole(), user.isEnabled(), user.isEmailVerified(), user.isBanned());
    }

    private AuthorResponse toAuthorResponse(Author author) {
        return new AuthorResponse(author.getId(), author.getName(), author.getProfileImage(),
                author.getDateOfBirth(), author.getPlaceOfBirth(), author.getBiography(),
                author.getAuthorType(), author.getUser() == null ? null : author.getUser().getId(),
                author.getUser() == null ? null : author.getUser().getUsername(),
                author.getUser() == null ? null : author.getUser().getEmail(),
                author.getCreatedAt(), author.getUpdatedAt());
    }
}
