package com.storyreview.service.impl;

import com.storyreview.dto.request.MessageRequests.ContactMessageRequest;
import com.storyreview.dto.response.ApiResponses.ContactMessageResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import com.storyreview.entity.ContactMessage;
import com.storyreview.repository.MessageRepository;
import com.storyreview.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messages;

    public MessageServiceImpl(MessageRepository messages) {
        this.messages = messages;
    }

    @Override
    public MessageResponse create(ContactMessageRequest request) {
        ContactMessage message = new ContactMessage();
        message.setName(request.name().trim());
        message.setEmail(request.email().trim().toLowerCase());
        message.setSubject(request.subject());
        message.setMessage(request.message().trim());
        messages.save(message);
        return new MessageResponse("Message received. We'll get back to you soon.");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactMessageResponse> getAll(Pageable pageable) {
        return messages.findAll(pageable).map(this::toResponse);
    }

    private ContactMessageResponse toResponse(ContactMessage message) {
        return new ContactMessageResponse(message.getId(), message.getName(), message.getEmail(),
                message.getSubject(), message.getMessage(), message.getCreatedAt());
    }
}
