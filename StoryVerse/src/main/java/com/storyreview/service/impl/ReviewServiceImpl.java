package com.storyreview.service.impl;

import com.storyreview.dto.request.ReviewRequests.CreateReviewRequest;
import com.storyreview.dto.request.ReviewRequests.UpdateReviewRequest;
import com.storyreview.dto.response.ApiResponses.ReviewResponse;
import com.storyreview.entity.Review;
import com.storyreview.enums.Role;
import com.storyreview.exception.ApiException;
import com.storyreview.repository.BookRepository;
import com.storyreview.repository.ReviewRepository;
import com.storyreview.repository.UserRepository;
import com.storyreview.service.ReviewService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviews;
    private final BookRepository books;
    private final UserRepository users;

    public ReviewServiceImpl(ReviewRepository reviews, BookRepository books, UserRepository users) {
        this.reviews = reviews;
        this.books = books;
        this.users = users;
    }

    @Override
    public ReviewResponse create(CreateReviewRequest request, Long userId, Role role) {
        if (role == Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrators cannot submit reviews");
        }
        if (reviews.existsByUserIdAndBookId(userId, request.bookId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already reviewed this book");
        }
        var book = books.findById(request.bookId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Book not found"));
        if (!book.isPublished()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You can't review a book that hasn't been published yet");
        }
        if (book.getCreatedBy().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot review your own book");
        }
        Review review = new Review();
        review.setBook(book);
        review.setUser(users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found")));
        review.setVerdict(request.verdict());
        review.setMessage(request.message());
        return toResponse(saveReview(review));
    }

    @Override
    public ReviewResponse update(Long id, UpdateReviewRequest request, Long userId, Role role) {
        Review review = findReview(id);
        assertCanModify(review, userId, role);
        review.setVerdict(request.verdict());
        review.setMessage(request.message());
        return toResponse(saveReview(review));
    }

    @Override
    public void delete(Long id, Long userId, Role role) {
        Review review = findReview(id);
        assertCanModify(review, userId, role);
        reviews.delete(review);
    }

    private void assertCanModify(Review review, Long userId, Role role) {
        if (role == Role.ADMIN) {
            return;
        }
        if (!review.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only modify your own reviews");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getById(Long id) {
        return toResponse(findReview(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getByBookId(Long bookId, Pageable pageable) {
        if (!books.existsById(bookId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Book not found");
        }
        return reviews.findByBookId(bookId, pageable).map(this::toResponse);
    }

    private Review findReview(Long id) {
        return reviews.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Review not found"));
    }

    private Review saveReview(Review review) {
        try {
            return reviews.save(review);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already reviewed this book");
        }
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(review.getId(), review.getBook().getId(), review.getUser().getId(),
                review.getUser().getUsername(), review.getVerdict(), review.getMessage(), review.getCreatedAt());
    }
}
