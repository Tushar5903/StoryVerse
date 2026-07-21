package com.storyreview.repository;

import com.storyreview.entity.Book;
import com.storyreview.enums.BookType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    boolean existsByTitleIgnoreCaseAndAuthorId(String title, Long authorId);
    boolean existsByTitleIgnoreCaseAndAuthorIdAndIdNot(String title, Long authorId, Long id);
    Optional<Book> findByIdAndBookType(Long id, BookType bookType);
    Page<Book> findByCreatedById(Long userId, Pageable pageable);
    Page<Book> findByCreatedByIdAndPublishedTrue(Long userId, Pageable pageable);
}
