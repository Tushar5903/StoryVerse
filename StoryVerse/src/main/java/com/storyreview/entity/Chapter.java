package com.storyreview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "chapters", indexes = @Index(name = "idx_chapters_book", columnList = "book_id"),
        uniqueConstraints = @UniqueConstraint(name = "uk_chapters_book_number", columnNames = {"book_id", "chapter_number"}))
public class Chapter extends BaseEntity {
    @Column(name = "chapter_number", nullable = false)
    private int chapterNumber;

    @Column(name = "chapter_title", nullable = false, length = 240)
    private String chapterTitle;

    // MEDIUMTEXT to match V11__scalability_hardening.sql - TEXT (65,535 bytes) cannot
    // hold the 1,000,000-char API cap, and ddl-auto=validate must see a matching type.
    @Column(name = "chapter_content", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String chapterContent;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
}
