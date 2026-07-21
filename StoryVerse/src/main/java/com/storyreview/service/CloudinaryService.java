package com.storyreview.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadAuthorImage(MultipartFile file);
    String uploadBookCover(MultipartFile file);
    String uploadProfileImage(MultipartFile file);
}
