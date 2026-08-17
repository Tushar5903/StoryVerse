package com.storyreview.repository;

import com.storyreview.entity.ReadingProgress;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, Long> {
    // Progress rows must never lazy-load per row: book + chapter fetched with the rows.
    @EntityGraph(attributePaths = {"book", "chapter"})
    List<ReadingProgress> findByUserIdOrderByUpdatedAtDesc(long userId);

    @EntityGraph(attributePaths = {"book", "chapter"})
    List<ReadingProgress> findByUserIdAndBookId(long userId, long bookId);

    Optional<ReadingProgress> findByUserIdAndChapterId(long userId, long chapterId);

    void deleteByUserIdAndChapterId(long userId, long chapterId);
}
