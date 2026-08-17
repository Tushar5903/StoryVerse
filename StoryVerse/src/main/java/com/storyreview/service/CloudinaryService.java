package com.storyreview.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadAuthorImage(MultipartFile file);
    String uploadBookCover(MultipartFile file);
    String uploadProfileImage(MultipartFile file);

    /**
     * Deletes the asset behind a Cloudinary secure URL. URLs that are not Cloudinary
     * (external image links) are ignored silently so orphaned files never accumulate
     * while external covers are never destroyed.
     */
    void deleteImage(String url);
}
