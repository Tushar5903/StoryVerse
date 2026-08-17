package com.storyreview.repository;

import com.storyreview.entity.Author;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;

import java.util.Optional;

public interface AuthorRepository extends JpaRepository<Author, Long>, JpaSpecificationExecutor<Author> {
    Optional<Author> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<Author> findByUserId(Long userId);

    // The public author mapping falls back to the linked user's image/bio, so the
    // user must be fetched eagerly or every row pays its own SELECT.
    @EntityGraph(attributePaths = "user")
    @Override
    Optional<Author> findById(Long id);

    @EntityGraph(attributePaths = "user")
    @Override
    Page<Author> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "user")
    @Override
    Page<Author> findAll(@Nullable Specification<Author> spec, Pageable pageable);
}