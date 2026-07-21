package com.storyreview.repository;

import com.storyreview.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByBookIdOrderByChapterNumberAsc(Long bookId);
    Optional<Chapter> findByBookIdAndChapterNumber(Long bookId, int chapterNumber);
    boolean existsByBookIdAndChapterNumber(Long bookId, int chapterNumber);
    boolean existsByBookIdAndChapterNumberAndIdNot(Long bookId, int chapterNumber, Long id);
    long countByBookId(Long bookId);
}
