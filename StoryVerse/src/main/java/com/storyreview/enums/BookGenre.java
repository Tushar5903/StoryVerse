package com.storyreview.enums;

import com.storyreview.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.List;

public enum BookGenre {
    ACTION("Action"),
    COMEDY("Comedy"),
    DRAMA("Drama"),
    HORROR("Horror"),
    INFORMATIVE("Informative"),
    MYSTERY("Mystery"),
    ROMANCE("Romance"),
    SCI_FI("Sci-Fi"),
    SPORTS("Sports"),
    THRILLER("Thriller");

    private final String displayName;

    BookGenre(String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }

    public static List<String> displayNames() {
        return Arrays.stream(values()).map(BookGenre::displayName).toList();
    }

    /**
     * Normalizes a raw genre string to the canonical display name, or returns null for blank values.
     * Unknown genres are rejected so the catalog can rely on a fixed, filterable genre set.
     */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return Arrays.stream(values())
                .filter(genre -> genre.displayName.equalsIgnoreCase(raw.trim()))
                .map(BookGenre::displayName)
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Unknown genre '" + raw.trim() + "'. Allowed: " + String.join(", ", displayNames())));
    }
}
