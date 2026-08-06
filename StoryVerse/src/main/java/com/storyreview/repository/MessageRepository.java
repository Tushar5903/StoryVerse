package com.storyreview.repository;

import com.storyreview.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<ContactMessage, Long> {
}
