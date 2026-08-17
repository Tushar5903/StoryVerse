package com.storyreview.repository;

import com.storyreview.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByBookIdOrderByChapterNumberAsc(Long bookId);
    Optional<Chapter> findByBookIdAndChapterNumber(Long bookId, int chapterNumber);
    boolean existsByBookIdAndChapterNumber(Long bookId, int chapterNumber);
    boolean existsByBookIdAndChapterNumberAndIdNot(Long bookId, int chapterNumber, Long id);
    long countByBookId(Long bookId);

    @Query("select c.book.id, count(c) from Chapter c where c.book.id in :ids group by c.book.id")
    List<Object[]> countByBookIds(@Param("ids") Collection<Long> bookIds);
}
