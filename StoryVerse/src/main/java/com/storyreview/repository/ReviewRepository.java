package com.storyreview.repository;

import com.storyreview.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUserIdAndBookId(Long userId, Long bookId);
    boolean existsByUserIdAndBookIdAndIdNot(Long userId, Long bookId, Long id);
    Page<Review> findByBookId(Long bookId, Pageable pageable);
}
