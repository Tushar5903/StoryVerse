package com.storyreview.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.storyreview.exception.ApiException;
import com.storyreview.exception.CloudinaryUploadException;
import com.storyreview.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class CloudinaryServiceImpl implements CloudinaryService {
    private static final Logger log = LoggerFactory.getLogger(CloudinaryServiceImpl.class);
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

    @Override
    public String uploadProfileImage(MultipartFile file) {
        return upload(file, "storyverse/profile-images");
    }

    @Override
    public void deleteImage(String url) {
        if (url == null || !url.contains("res.cloudinary.com") || !url.contains("/image/upload/")) {
            return;
        }
        try {
            String publicId = extractPublicId(url);
            if (publicId != null && !publicId.isBlank()) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
            }
        } catch (Exception ex) {
            // A failed delete must never fail the request that triggered it (e.g. book
            // deletion) - the DB row is already gone; only the orphan remains.
            log.warn("Failed to delete Cloudinary asset: {}", ex.getMessage());
        }
    }

    /**
     * https://res.cloudinary.com/<cloud>/image/upload/v1234/storyverse/book-covers/<id>.jpg
     * -> storyverse/book-covers/<id>. The public id is the path after /image/upload/
     * (minus the version prefix and file extension).
     */
    private String extractPublicId(String url) {
        int idx = url.indexOf("/image/upload/");
        if (idx < 0) {
            return null;
        }
        String path = url.substring(idx + "/image/upload/".length());
        int slash = path.indexOf('/');
        if (slash >= 0 && path.charAt(0) == 'v' && path.substring(0, slash).matches("v\\d+")) {
            path = path.substring(slash + 1);
        }
        int dot = path.lastIndexOf('.');
        return dot > 0 ? path.substring(0, dot) : path;
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
        // The MIME header is client-controlled - sniff the actual bytes so a polyglot
        // (e.g. HTML/SVG masquerading as image/png) can't get through.
        try {
            if (!hasValidImageSignature(file)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "File content does not match the declared image type");
            }
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read uploaded file");
        }
    }

    private boolean hasValidImageSignature(MultipartFile file) throws IOException {
        byte[] head;
        try (java.io.InputStream in = file.getInputStream()) {
            head = in.readNBytes(12);
        }
        if (head.length >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
            return true; // JPEG
        }
        if (head.length >= 8 && (head[0] & 0xFF) == 0x89 && head[1] == 'P' && head[2] == 'N' && head[3] == 'G'
                && (head[4] & 0xFF) == 0x0D && (head[5] & 0xFF) == 0x0A && (head[6] & 0xFF) == 0x1A && (head[7] & 0xFF) == 0x0A) {
            return true; // PNG
        }
        if (head.length >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') {
            return true; // WEBP
        }
        if (head.length >= 6 && head[0] == 'G' && head[1] == 'I' && head[2] == 'F'
                && head[3] == '8' && (head[4] == '7' || head[4] == '9') && head[5] == 'a') {
            return true; // GIF87a / GIF89a
        }
        return false;
    }
}
