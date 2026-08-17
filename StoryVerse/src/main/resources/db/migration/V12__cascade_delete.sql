-- V12: cascade deletes for dependent rows.
-- A book that received any review or reading-progress row could never be deleted
-- (FK RESTRICT), and chapters marked read couldn't be deleted either - both failed
-- with a DataIntegrityViolationException forever. Dependent rows are meaningless
-- without their parent, so they now go with it.

ALTER TABLE reading_progress DROP FOREIGN KEY fk_reading_progress_book;
ALTER TABLE reading_progress DROP FOREIGN KEY fk_reading_progress_chapter;
ALTER TABLE reviews DROP FOREIGN KEY fk_reviews_book;

ALTER TABLE reading_progress
    ADD CONSTRAINT fk_reading_progress_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
ALTER TABLE reading_progress
    ADD CONSTRAINT fk_reading_progress_chapter
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE;
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
