package com.storyreview.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Server-side HTML sanitizer for user-authored chapter content.
 *
 * Sanitizing happens once at write time (chapter create/update) so the hot read
 * path stays untouched. The safelist only admits tags/attributes the Lexical
 * editor actually emits (headings, emphasis, quotes, lists, links) — everything
 * else (script, iframe, style, event handlers, javascript: URLs, images) is
 * stripped.
 */
public final class HtmlSanitizer {
    private static final Safelist SAFELIST = Safelist.basic()
            .addTags("h1", "h2", "h3", "u", "s", "strike", "del", "span", "sup", "sub")
            .addEnforcedAttribute("a", "rel", "nofollow noopener noreferrer");

    private HtmlSanitizer() {
    }

    /**
     * Returns sanitized HTML. Plain text (no markup) passes through untouched.
     */
    public static String clean(String html) {
        if (html == null || html.isBlank()) {
            return html;
        }
        if (!html.contains("<")) {
            return html;
        }
        return Jsoup.clean(html, SAFELIST);
    }
}