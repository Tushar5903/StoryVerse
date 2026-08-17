package com.storyreview.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Set;

/**
 * Whitelists the sort properties a client may request. Spring Data resolves
 * {@code ?sort=} against the entity graph, so arbitrary property paths would
 * otherwise let callers probe entity structure and trigger pathological joins.
 * Orders naming anything outside the allowed set are dropped; if nothing
 * survives, the page falls back to the repository's default order.
 */
public final class SortSanitizer {
    private SortSanitizer() {}

    public static Pageable allow(Pageable pageable, Set<String> allowedProperties) {
        if (pageable == null || pageable.isUnpaged() || !pageable.getSort().isSorted()) {
            return pageable;
        }
        List<Sort.Order> kept = pageable.getSort().stream()
                .filter(order -> allowedProperties.contains(order.getProperty()))
                .toList();
        if (kept.isEmpty()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(kept));
    }
}