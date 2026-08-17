package com.storyreview.repository;

import com.storyreview.entity.Review;
import com.storyreview.enums.ReviewVerdict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUserIdAndBookId(Long userId, Long bookId);
    boolean existsByUserIdAndBookIdAndIdNot(Long userId, Long bookId, Long id);

    // user + book are fetched in the same query so ReviewResponse can embed the book
    // snapshot (title/cover/type/year) without a getBook() N+1 storm on review lists.
    @EntityGraph(attributePaths = {"user", "book"})
    Page<Review> findByBookId(Long bookId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "book"})
    Page<Review> findByBookIdAndVerdict(Long bookId, ReviewVerdict verdict, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "book"})
    Page<Review> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "book"})
    Page<Review> findByUserIdAndBook_PublishedTrue(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "book"})
    Optional<Review> findByUserIdAndBookId(Long userId, Long bookId);

    @EntityGraph(attributePaths = {"user", "book"})
    Page<Review> findByBook_PublishedTrue(Pageable pageable);

    long countByBookId(Long bookId);

    @Query("select r.book.id, count(r) from Review r where r.book.id in :ids group by r.book.id")
    List<Object[]> countByBookIds(@Param("ids") Collection<Long> bookIds);

    @Query("select r.book.id, r.verdict, count(r) from Review r where r.book.id in :ids group by r.book.id, r.verdict")
    List<Object[]> countByBookIdsAndVerdict(@Param("ids") Collection<Long> bookIds);
}