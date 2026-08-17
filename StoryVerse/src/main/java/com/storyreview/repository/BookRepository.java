package com.storyreview.repository;

import com.storyreview.entity.Book;
import com.storyreview.enums.BookType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    boolean existsByTitleIgnoreCaseAndAuthorId(String title, Long authorId);
    boolean existsByTitleIgnoreCaseAndAuthorIdAndIdNot(String title, Long authorId, Long id);
    Optional<Book> findByIdAndBookType(Long id, BookType bookType);

    @EntityGraph(attributePaths = {"author", "createdBy"})
    Page<Book> findByCreatedById(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "createdBy"})
    Page<Book> findByCreatedByIdAndPublishedTrue(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "createdBy"})
    @Override
    Optional<Book> findById(Long id);

    // AdminController.allBooks uses the plain (non-Specification) overload - without the
    // graph below every row paid its own author + createdBy SELECT during DTO mapping.
    @EntityGraph(attributePaths = {"author", "createdBy"})
    @Override
    Page<Book> findAll(Pageable pageable);

    // EntityGraph with a Specification: the graph is applied by the derived query factory,
    // eliminating the per-row lazy loads (author/createdBy/genres/tags) during DTO mapping.
    @EntityGraph(attributePaths = {"author", "createdBy"})
    @Override
    Page<Book> findAll(@Nullable Specification<Book> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "createdBy"})
    @Override
    List<Book> findAll(@Nullable Specification<Book> spec);

    // progress batches: author + createdBy + genres in ONE query (BookProgressResponse
    // renders createdBy via toResponse, so it must be fetched up front, not lazily).
    @Query("select distinct b from Book b left join fetch b.author left join fetch b.genres left join fetch b.createdBy where b.id in :ids")
    List<Book> findDetailsByIds(@Param("ids") Collection<Long> ids);

    @EntityGraph(attributePaths = {"author", "createdBy"})
    Page<Book> findByAuthorIdAndPublishedTrue(Long authorId, Pageable pageable);

    // MySQL FULLTEXT over (title, subtitle, description). Boolean mode so a trailing *
    // gives prefix matching; the caller strips boolean-mode operators from user input.
    @Query(value = "select b.id from books b where match(b.title, b.subtitle, b.description) against (:query in boolean mode)",
            nativeQuery = true)
    List<Long> findIdsByFulltext(@Param("query") String query);
}