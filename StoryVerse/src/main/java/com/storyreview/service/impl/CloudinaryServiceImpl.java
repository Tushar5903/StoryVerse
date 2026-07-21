package com.storyreview.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.storyreview.exception.ApiException;
import com.storyreview.exception.CloudinaryUploadException;
import com.storyreview.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class CloudinaryServiceImpl implements CloudinaryService {
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private final Cloudinary cloudinary;

    public CloudinaryServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public String uploadAuthorImage(MultipartFile file) {
        return upload(file, "storyverse/authors");
    }

    @Override
    public String uploadBookCover(MultipartFile file) {
        return upload(file, "storyverse/book-covers");
    }

    private String upload(MultipartFile file, String folder) {
        validateFile(file);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", folder, "resource_type", "image"));
            Object url = result.get("secure_url");
            if (url == null) {
                throw new CloudinaryUploadException("Cloudinary upload did not return a URL");
            }
            return url.toString();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read uploaded file");
        } catch (CloudinaryUploadException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new CloudinaryUploadException("Cloudinary upload failed: " + ex.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid image type. Allowed: JPEG, PNG, WEBP, GIF");
        }
    }
}
