package com.storyreview.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Browser cache headers for the public, non-personalized GET endpoints. A short
 * Cache-Control lets repeat visits (and back-button navigations) skip the HTTP
 * round trip entirely - the backend Caffeine cache only saves the DB query, not
 * the network transfer. Max-age is deliberately small (30s) so edits/deletes are
 * reflected promptly; the header is only applied to 200 responses (never cached
 * 404s/errors), mutations never get it, and personalized paths (/mine, /me) are
 * excluded.
 */
@Component
public class HttpCacheFilter extends OncePerRequestFilter {

    private static final String CACHE_CONTROL = "Cache-Control";
    private static final String PUBLIC_MAX_AGE = "public, max-age=30";

    private static final List<String> CACHEABLE_PREFIXES = List.of(
            "/api/books", "/api/authors", "/api/reviews", "/api/chapters", "/api/genres",
            "/api/health", "/api/users/");

    private static final List<String> EXCLUDED_FRAGMENTS = List.of("/mine", "/me");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (HttpMethod.GET.matches(request.getMethod()) && isCacheable(request.getRequestURI())) {
            filterChain.doFilter(request, new CachingResponse(response));
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private boolean isCacheable(String path) {
        if (EXCLUDED_FRAGMENTS.stream().anyMatch(path::contains)) {
            return false;
        }
        return CACHEABLE_PREFIXES.stream().anyMatch(prefix ->
                prefix.endsWith("/") ? path.startsWith(prefix) : path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    /** Adds the cache header only when the response actually commits as 200. */
    private static final class CachingResponse extends HttpServletResponseWrapper {
        private boolean applied = false;

        CachingResponse(HttpServletResponse response) {
            super(response);
        }

        @Override
        public void setStatus(int sc) {
            super.setStatus(sc);
            applyIfOk();
        }

        @Override
        public void sendError(int sc) throws IOException {
            super.sendError(sc);
            applyIfOk();
        }

        @Override
        public void sendError(int sc, String msg) throws IOException {
            super.sendError(sc, msg);
            applyIfOk();
        }

        @Override
        public jakarta.servlet.ServletOutputStream getOutputStream() throws IOException {
            applyIfOk();
            return super.getOutputStream();
        }

        @Override
        public java.io.PrintWriter getWriter() throws IOException {
            applyIfOk();
            return super.getWriter();
        }

        @Override
        public void flushBuffer() throws IOException {
            applyIfOk();
            super.flushBuffer();
        }

        private void applyIfOk() {
            int status = super.getStatus();
            if (status == 200 && !applied) {
                super.setHeader(CACHE_CONTROL, PUBLIC_MAX_AGE);
                applied = true;
            } else if (status != 200 && applied) {
                // A later sendError can overwrite an early 200 - never cache errors.
                super.setHeader(CACHE_CONTROL, "no-store");
                applied = false;
            }
        }
    }
}