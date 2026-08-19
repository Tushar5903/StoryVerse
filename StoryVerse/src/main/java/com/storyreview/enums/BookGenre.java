package com.storyreview.enums;

import com.storyreview.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public enum BookGenre {
    ACTION("Action"),
    ADVENTURE("Adventure"),
    BIOGRAPHY("Biography"),
    BUSINESS("Business"),
    CHILDRENS_BOOKS("Children's Books"),
    CLASSICS("Classics"),
    COMEDY("Comedy"),
    CRIME("Crime"),
    DRAMA("Drama"),
    FANTASY("Fantasy"),
    HISTORICAL_FICTION("Historical Fiction"),
    HISTORY("History"),
    HORROR("Horror"),
    INFORMATIVE("Informative"),
    LITERARY_FICTION("Literary Fiction"),
    MYSTERY("Mystery"),
    POETRY("Poetry"),
    ROMANCE("Romance"),
    SCI_FI("Science Fiction"),
    SELF_HELP("Self-Help"),
    SPORTS("Sports"),
    TECHNOLOGY("Technology"),
    THRILLER("Thriller"),
    YOUNG_ADULT("Young Adult");

    /**
     * Legacy spellings that resolve to a canonical display name. The old "Sci-Fi" label
     * maps onto "Science Fiction" so pre-existing book genres keep normalizing.
     */
    private static final Map<String, String> ALIASES = Map.of(
            "sci-fi", "Science Fiction",
            "science fiction", "Science Fiction");

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
        String trimmed = raw.trim();
        String alias = ALIASES.get(trimmed.toLowerCase());
        if (alias != null) {
            return alias;
        }
        return Arrays.stream(values())
                .filter(genre -> genre.displayName.equalsIgnoreCase(trimmed))
                .map(BookGenre::displayName)
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Unknown genre '" + trimmed + "'. Allowed: " + String.join(", ", displayNames())));
    }

    /**
     * Normalizes a collection of genres into a canonical, de-duplicated, insertion-ordered set.
     * Blank/unknown entries are rejected individually via {@link #normalize(String)}.
     */
    public static Set<String> normalizeAll(Collection<String> raw) {
        Set<String> result = new LinkedHashSet<>();
        if (raw == null || raw.isEmpty()) {
            return result;
        }
        for (String value : raw) {
            String normalized = normalize(value);
            if (normalized != null) {
                result.add(normalized);
            }
        }
        return result;
    }
}
