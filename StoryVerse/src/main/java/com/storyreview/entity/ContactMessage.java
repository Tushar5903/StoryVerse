package com.storyreview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "contact_messages")
public class ContactMessage extends BaseEntity {
    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 190)
    private String email;

    @Column(length = 240)
    private String subject;

    @Column(nullable = false, length = 4000)
    private String message;
}
