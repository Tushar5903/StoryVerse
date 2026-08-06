-- Multi-genre books: move the single books.genre value into a book_genres join table.
-- The entity now maps genres as an element collection (same pattern as book_tags).

CREATE TABLE book_genres (
    book_id BIGINT NOT NULL,
    genre VARCHAR(80) NOT NULL,
    CONSTRAINT pk_book_genres PRIMARY KEY (book_id, genre),
    CONSTRAINT fk_book_genres_book FOREIGN KEY (book_id) REFERENCES books(id)
);

INSERT INTO book_genres (book_id, genre)
SELECT id, REPLACE(genre, 'Sci-Fi', 'Science Fiction')
FROM books
WHERE genre IS NOT NULL AND TRIM(genre) <> '';

ALTER TABLE books DROP COLUMN genre;
