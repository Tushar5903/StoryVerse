package com.storyreview.entity;

import com.storyreview.enums.BookType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "books", indexes = {
        @Index(name = "idx_books_title", columnList = "title"),
        @Index(name = "idx_books_type", columnList = "book_type"),
        @Index(name = "idx_books_author", columnList = "author_id")
}, uniqueConstraints = @UniqueConstraint(name = "uk_books_title_author", columnNames = {"title", "author_id"}))
public class Book extends BaseEntity {
    @Column(nullable = false, length = 240)
    private String title;

    @Column(length = 240)
    private String subtitle;

    @Column(length = 4000)
    private String description;

    @Column(name = "cover_image", length = 500)
    private String coverImage;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(nullable = false)
    private boolean published = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "book_type", nullable = false, length = 32)
    private BookType bookType;

    @Column(length = 80)
    private String language;

    // SUBSELECT (instead of fetch-joining into paged queries): genres/tags load in ONE
    // extra query per page without multiplying rows, so pagination stays in the database.
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "book_genres", joinColumns = @JoinColumn(name = "book_id"))
    @Column(name = "genre", length = 80)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    private Set<String> genres = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "book_tags", joinColumns = @JoinColumn(name = "book_id"))
    @Column(name = "tag", length = 80)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    private Set<String> tags = new HashSet<>();

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private Author author;

    @OneToMany(mappedBy = "book", fetch = FetchType.LAZY, cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<Chapter> chapters = new ArrayList<>();
}
