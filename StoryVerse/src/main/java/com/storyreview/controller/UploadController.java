package com.storyreview.controller;

import com.storyreview.dto.response.ApiResponses.ImageUploadResponse;
import com.storyreview.service.CloudinaryService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class UploadController {
    private final CloudinaryService cloudinaryService;

    public UploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping(value = "/author-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    ImageUploadResponse uploadAuthorImage(@RequestPart("file") MultipartFile file) {
        return new ImageUploadResponse(cloudinaryService.uploadAuthorImage(file));
    }

    @PostMapping(value = "/book-cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    ImageUploadResponse uploadBookCover(@RequestPart("file") MultipartFile file) {
        return new ImageUploadResponse(cloudinaryService.uploadBookCover(file));
    }
}
