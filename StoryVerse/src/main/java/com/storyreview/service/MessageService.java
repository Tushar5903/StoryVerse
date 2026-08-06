package com.storyreview.service;

import com.storyreview.dto.request.MessageRequests.ContactMessageRequest;
import com.storyreview.dto.response.ApiResponses.ContactMessageResponse;
import com.storyreview.dto.response.ApiResponses.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {
    MessageResponse create(ContactMessageRequest request);

    Page<ContactMessageResponse> getAll(Pageable pageable);
}
