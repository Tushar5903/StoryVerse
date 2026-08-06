package com.storyreview.controller;

import com.storyreview.dto.request.MessageRequests.ContactMessageRequest;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final MessageService messageService;

    public ContactController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MessageResponse submit(@Valid @RequestBody ContactMessageRequest request) {
        return messageService.create(request);
    }
}
