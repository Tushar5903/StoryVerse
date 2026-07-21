package com.storyreview.entity;

import com.storyreview.enums.ReviewVerdict;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "reviews", indexes = @Index(name = "idx_reviews_book", columnList = "book_id"),
        uniqueConstraints = @UniqueConstraint(name = "uk_reviews_user_book", columnNames = {"user_id", "book_id"}))
public class Review extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewVerdict verdict;

    @Column(name = "message", length = 5000)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
