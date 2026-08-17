-- V13: composite indexes for the hot sorted list paths.
-- Review lists are always sorted by created_at DESC within a single book (book detail
-- page) or a single user (my reviews / profile reviews) - the single-column indexes
-- from V11 (idx_reviews_book_verdict, idx_reviews_created) can't serve both halves of
-- the range scan. Note: chapters(book_id, chapter_number) needs no index of its own -
-- the uk_chapters_book_number unique constraint already backs exactly that composite.
CREATE INDEX idx_reviews_book_created ON reviews (book_id, created_at);
CREATE INDEX idx_reviews_user_created ON reviews (user_id, created_at);

-- The paginated "author's published works" query filters author_id + published
-- (then sorts by created_at). An FK index on author_id alone is not selective enough
-- for authors with many works.
CREATE INDEX idx_books_author_published ON books (author_id, published);
