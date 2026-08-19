-- V14: super-admin user/author deletion needs DB-level cascades.
-- The super admin can DELETE any user/author. Users have no JPA object graph
-- (User is a plain @Entity with no @OneToMany), so Hibernate just removes the
-- row and the database must take the whole dependency tree with it - otherwise
-- every FK below (all RESTRICT) fails the delete. Same for author rows when
-- removed at the DB level. Pattern matches V12 (drop + re-add with CASCADE).
--
-- Chain: users -> books (created_by) -> chapters / book_genres / book_tags
--                     -> reviews (V12) / reading_progress (V12)
--        users -> authors -> books -> chapters / book_genres / book_tags -> ...
--        users -> reviews / reading_progress / refresh_tokens /
--                 password_reset_tokens / verification_tokens (vestigial table)

ALTER TABLE books DROP FOREIGN KEY fk_books_created_by;
ALTER TABLE books DROP FOREIGN KEY fk_books_author;
ALTER TABLE chapters DROP FOREIGN KEY fk_chapters_book;
ALTER TABLE book_genres DROP FOREIGN KEY fk_book_genres_book;
ALTER TABLE book_tags DROP FOREIGN KEY fk_book_tags_book;
ALTER TABLE reviews DROP FOREIGN KEY fk_reviews_user;
ALTER TABLE reading_progress DROP FOREIGN KEY fk_reading_progress_user;
ALTER TABLE authors DROP FOREIGN KEY fk_authors_user;
ALTER TABLE refresh_tokens DROP FOREIGN KEY fk_refresh_tokens_user;
ALTER TABLE password_reset_tokens DROP FOREIGN KEY fk_password_reset_tokens_user;
ALTER TABLE verification_tokens DROP FOREIGN KEY fk_verification_tokens_user;

ALTER TABLE books
    ADD CONSTRAINT fk_books_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE books
    ADD CONSTRAINT fk_books_author
        FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE;
ALTER TABLE chapters
    ADD CONSTRAINT fk_chapters_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
ALTER TABLE book_genres
    ADD CONSTRAINT fk_book_genres_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
ALTER TABLE book_tags
    ADD CONSTRAINT fk_book_tags_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reading_progress
    ADD CONSTRAINT fk_reading_progress_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE authors
    ADD CONSTRAINT fk_authors_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE password_reset_tokens
    ADD CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE verification_tokens
    ADD CONSTRAINT fk_verification_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
