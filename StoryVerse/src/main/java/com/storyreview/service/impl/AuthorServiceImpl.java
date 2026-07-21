package com.storyreview.service.impl;

import com.storyreview.dto.request.AuthorRequests.CreateAuthorRequest;
import com.storyreview.dto.request.AuthorRequests.UpdateAuthorRequest;
import com.storyreview.dto.response.ApiResponses.AuthorResponse;
import com.storyreview.dto.response.ApiResponses.BookResponse;
import com.storyreview.entity.Author;
import com.storyreview.enums.AuthorType;
import com.storyreview.entity.Book;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.AuthorRepository;
import com.storyreview.repository.BookRepository;
import com.storyreview.service.AuthorService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AuthorServiceImpl implements AuthorService {
    private final AuthorRepository authors;
    private final BookRepository books;

    public AuthorServiceImpl(AuthorRepository authors, BookRepository books) {
        this.authors = authors;
        this.books = books;
    }

    @Override
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
    public AuthorResponse update(Long id, UpdateAuthorRequest request) {
        Author author = findAuthor(id);
        if (authors.existsByNameIgnoreCaseAndIdNot(request.name(), id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Author with this name already exists");
        }
        applyFields(author, request.name(), request.profileImage(), request.dateOfBirth(),
                request.placeOfBirth(), request.biography());
        return toResponse(saveAuthor(author));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorResponse getById(Long id) {
        return toResponse(findAuthor(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuthorResponse> getAll(Pageable pageable) {
        return authors.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getBooks(Long authorId) {
        findAuthor(authorId);
        return books.findAll((root, query, cb) -> cb.and(
                        cb.equal(root.get("author").get("id"), authorId),
                        cb.isTrue(root.get("published"))))
                .stream().map(this::toBookResponse).toList();
    }

    private Author findAuthor(Long id) {
        return authors.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Author not found"));
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
        return new AuthorResponse(author.getId(), author.getName(), author.getProfileImage(),
                author.getDateOfBirth(), author.getPlaceOfBirth(), author.getBiography(),
                author.getAuthorType(), author.getUser() == null ? null : author.getUser().getId(),
                author.getUser() == null ? null : author.getUser().getUsername(),
                author.getUser() == null ? null : author.getUser().getEmail(),
                author.getCreatedAt(), author.getUpdatedAt());
    }

    private BookResponse toBookResponse(Book book) {
        return new BookResponse(book.getId(), book.getTitle(), book.getSubtitle(), book.getDescription(),
                book.getCoverImage(), book.getThumbnailUrl(), book.getBookType(), book.isPublished(), book.getLanguage(), book.getGenre(),
                book.getTags(), book.getPublicationDate(), book.getCreatedBy().getId(), book.getAuthor().getId(),
                book.getAuthor().getName(), book.getCreatedAt(), book.getUpdatedAt());
    }
}
