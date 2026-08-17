package com.storyreview.service.impl;

import com.storyreview.dto.request.AuthorRequests.CreateAuthorRequest;
import com.storyreview.dto.request.AuthorRequests.UpdateAuthorRequest;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.entity.Author;
import com.storyreview.entity.User;
import com.storyreview.enums.AuthorType;
import com.storyreview.enums.Role;
import com.storyreview.entity.Book;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ReviewRepository;
import com.storyreview.security.CurrentUser;
import com.storyreview.service.AuthorService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthorServiceImpl implements AuthorService {
    private final AuthorRepository authors;
    private final BookRepository books;
    private final ReviewRepository reviews;

    public AuthorServiceImpl(AuthorRepository authors, BookRepository books, ReviewRepository reviews) {
        this.authors = authors;
        this.books = books;
        this.reviews = reviews;
    }

    @Override
    @CacheEvict(cacheNames = {"authors", "authorBooks"}, allEntries = true)
    public AuthorResponse create(CreateAuthorRequest request) {
        if (authors.existsByNameIgnoreCase(request.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "Author with this name already exists");
        }
        Author author = new Author();
        author.setAuthorType(AuthorType.ADMIN);
        applyFields(author, request.name(), request.profileImage(), request.dateOfBirth(),
                request.placeOfBirth(), request.biography());
        return toResponse(saveAuthor(author));
    }

    @Override
    @CacheEvict(cacheNames = {"authors", "authorBooks"}, allEntries = true)
    public AuthorResponse update(Long id, UpdateAuthorRequest request, CurrentUser currentUser) {
        Author author = findAuthor(id);
        if (!canEdit(author, currentUser)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to edit this author");
        }
        if (authors.existsByNameIgnoreCaseAndIdNot(request.name(), id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Author with this name already exists");
        }
        applyFields(author, request.name(), request.profileImage(), request.dateOfBirth(),
                request.placeOfBirth(), request.biography());
        return toResponse(saveAuthor(author));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "authors", key = "#id")
    public AuthorResponse getById(Long id) {
        return toResponse(findAuthor(id));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "authors", key = "{'all', #pageable.pageNumber, #pageable.pageSize, #pageable.sort}")
    public Page<AuthorResponse> getAll(Pageable pageable) {
        return authors.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "authorBooks",
            key = "{#authorId, #pageable.pageNumber, #pageable.pageSize, #pageable.sort}")
    public Page<BookResponse> getBooks(Long authorId, Pageable pageable) {
        findAuthor(authorId);
        Page<Book> found = books.findByAuthorIdAndPublishedTrue(authorId, pageable);
        Map<Long, Long> counts = found.isEmpty() ? Map.of()
                : reviews.countByBookIds(found.getContent().stream().map(Book::getId).toList())
                        .stream().collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        return found.map(book -> toBookResponse(book, counts.getOrDefault(book.getId(), 0L)));
    }

    private Author findAuthor(Long id) {
        return authors.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Author not found"));
    }

    /**
     * A user-linked author profile mirrors the linked user's identity (image, bio, date of birth
     * and profile data), so only that user may edit it. Admins manage the standalone author
     * profiles they create (author.user == null); user-linked profiles are the user's own.
     */
    private boolean canEdit(Author author, CurrentUser currentUser) {
        if (currentUser == null) {
            return false;
        }
        if (currentUser.role() == Role.ADMIN) {
            return author.getUser() == null;
        }
        return author.getUser() != null && author.getUser().getId().equals(currentUser.id());
    }

    private Author saveAuthor(Author author) {
        try {
            return authors.save(author);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "Author with this name already exists");
        }
    }

    private void applyFields(Author author, String name, String profileImage,
                             java.time.LocalDate dateOfBirth, String placeOfBirth, String biography) {
        author.setName(name.trim());
        author.setProfileImage(profileImage);
        author.setDateOfBirth(dateOfBirth);
        author.setPlaceOfBirth(placeOfBirth);
        author.setBiography(biography);
    }

    private AuthorResponse toResponse(Author author) {
        User linkedUser = author.getUser();
        String profileImage = author.getProfileImage();
        String biography = author.getBiography();
        if (linkedUser != null) {
            if (profileImage == null) {
                profileImage = linkedUser.getProfileImage();
            }
            if (biography == null) {
                biography = linkedUser.getBio();
            }
        }
        return new AuthorResponse(author.getId(), author.getName(), profileImage,
                author.getDateOfBirth(), author.getPlaceOfBirth(), biography,
                author.getAuthorType(), linkedUser == null ? null : linkedUser.getId(),
                linkedUser == null ? null : linkedUser.getUsername(),
                null, author.getCreatedAt(), author.getUpdatedAt());
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
}
