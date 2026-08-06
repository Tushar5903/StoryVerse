package com.storyreview.controller;

import com.storyreview.dto.response.ApiResponses.ContactMessageResponse;
import com.storyreview.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
@PreAuthorize("hasRole('ADMIN')")
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    // Contact messages submitted by users via POST /api/contact. Admin only.
    @GetMapping
    Page<ContactMessageResponse> list(Pageable pageable) {
        return messageService.getAll(pageable);
    }
}
