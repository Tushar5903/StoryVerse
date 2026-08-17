-- V11: scalability & correctness hardening
-- 1. chapters.chapter_content is TEXT (max 65,535 bytes) but the API allows up to
--    1,000,000 characters - long chapters fail with "Data too long for column".
--    MEDIUMTEXT (16 MB) covers the allowed ceiling with headroom.
ALTER TABLE chapters MODIFY chapter_content MEDIUMTEXT NOT NULL;

-- 2. Indexes for the hot query paths (pagination filters, per-user listings, verdict tabs):
CREATE INDEX idx_books_created_by ON books(created_by);
CREATE INDEX idx_books_created_published ON books(created_by, published);
CREATE INDEX idx_books_published_created ON books(published, created_at);
CREATE INDEX idx_reviews_book_verdict ON reviews(book_id, verdict);
CREATE INDEX idx_reviews_created ON reviews(created_at);
-- genre is the second column of book_genres' composite PK - a genre-only probe scans it.
CREATE INDEX idx_book_genres_genre ON book_genres(genre);

-- 3. Full-text search for the catalog's %term% LIKE (title/subtitle/description).
--    Used via MATCH ... AGAINST in boolean mode with a LIKE fallback for short terms.
CREATE FULLTEXT INDEX ft_books_search ON books(title, subtitle, description);
