package com.storyreview.repository;

import com.storyreview.entity.ReadingProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, Long> {
    List<ReadingProgress> findByUserIdOrderByUpdatedAtDesc(long userId);

    List<ReadingProgress> findByUserIdAndBookId(long userId, long bookId);

    Optional<ReadingProgress> findByUserIdAndChapterId(long userId, long chapterId);

    void deleteByUserIdAndChapterId(long userId, long chapterId);
}
