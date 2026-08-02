package com.storyreview.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ReviewVerdict {
    SKIP, TIMEPASS, GO_FOR_IT, PERFECTION;

    @JsonCreator
    public static ReviewVerdict from(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase().replace("_", "");
        for (ReviewVerdict verdict : values()) {
            if (verdict.name().replace("_", "").equals(normalized)) {
                return verdict;
            }
        }
        throw new IllegalArgumentException("Unknown verdict: " + value);
    }
}
