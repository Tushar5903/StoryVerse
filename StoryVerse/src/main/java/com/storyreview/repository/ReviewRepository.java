package com.storyreview.repository;

import com.storyreview.entity.Review;
import com.storyreview.enums.ReviewVerdict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUserIdAndBookId(Long userId, Long bookId);
    boolean existsByUserIdAndBookIdAndIdNot(Long userId, Long bookId, Long id);
    Page<Review> findByBookId(Long bookId, Pageable pageable);
    Page<Review> findByBookIdAndVerdict(Long bookId, ReviewVerdict verdict, Pageable pageable);
    Page<Review> findByUserId(Long userId, Pageable pageable);
    Page<Review> findByUserIdAndBook_PublishedTrue(Long userId, Pageable pageable);
    Page<Review> findByBook_PublishedTrue(Pageable pageable);
}
