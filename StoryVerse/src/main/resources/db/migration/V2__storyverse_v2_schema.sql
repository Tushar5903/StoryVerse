-- StoryVerse v2 schema migration

ALTER TABLE users ADD COLUMN username VARCHAR(80);
UPDATE users SET username = CONCAT('user_', id) WHERE username IS NULL;
ALTER TABLE users MODIFY username VARCHAR(80) NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);
CREATE INDEX idx_users_username ON users(username);

UPDATE users SET role = 'USER' WHERE role IN ('READER', 'WRITER');

ALTER TABLE authors ADD COLUMN profile_image VARCHAR(500);
ALTER TABLE authors ADD COLUMN date_of_birth DATE;
ALTER TABLE authors ADD COLUMN place_of_birth VARCHAR(200);
ALTER TABLE authors MODIFY biography VARCHAR(5000);
ALTER TABLE authors ADD CONSTRAINT uk_authors_name UNIQUE (name);

DROP TABLE IF EXISTS book_authors;

ALTER TABLE books ADD COLUMN subtitle VARCHAR(240);
ALTER TABLE books ADD COLUMN description VARCHAR(4000);
UPDATE books SET description = synopsis WHERE description IS NULL;
ALTER TABLE books MODIFY description VARCHAR(4000) NOT NULL;
ALTER TABLE books ADD COLUMN cover_image VARCHAR(500);
UPDATE books SET cover_image = cover_image_path;
ALTER TABLE books DROP COLUMN cover_image_path;
ALTER TABLE books ADD COLUMN book_type VARCHAR(32);
UPDATE books SET book_type = 'USER_BOOK' WHERE book_type IS NULL;
ALTER TABLE books MODIFY book_type VARCHAR(32) NOT NULL;
ALTER TABLE books ADD COLUMN language VARCHAR(80);
ALTER TABLE books ADD COLUMN genre VARCHAR(80);
ALTER TABLE books ADD COLUMN publication_date DATE;
ALTER TABLE books ADD COLUMN author_id BIGINT;
ALTER TABLE books ADD COLUMN created_by BIGINT;

UPDATE books b SET created_by = b.owner_id;
ALTER TABLE books MODIFY created_by BIGINT NOT NULL;
ALTER TABLE books ADD CONSTRAINT fk_books_created_by FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE books DROP COLUMN status;
ALTER TABLE books DROP FOREIGN KEY fk_books_owner;
ALTER TABLE books DROP COLUMN owner_id;
ALTER TABLE books DROP COLUMN synopsis;

CREATE TABLE book_tags (
  book_id BIGINT NOT NULL,
  tag VARCHAR(80) NOT NULL,
  CONSTRAINT fk_book_tags_book FOREIGN KEY (book_id) REFERENCES books(id)
);

ALTER TABLE books ADD CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors(id);
ALTER TABLE books ADD CONSTRAINT uk_books_title_author UNIQUE (title, author_id);
CREATE INDEX idx_books_type ON books(book_type);
CREATE INDEX idx_books_author ON books(author_id);

CREATE TABLE chapters (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chapter_number INT NOT NULL,
  chapter_title VARCHAR(240) NOT NULL,
  chapter_content TEXT NOT NULL,
  book_id BIGINT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT uk_chapters_book_number UNIQUE (book_id, chapter_number),
  CONSTRAINT fk_chapters_book FOREIGN KEY (book_id) REFERENCES books(id)
);
CREATE INDEX idx_chapters_book ON chapters(book_id);

ALTER TABLE reviews ADD COLUMN verdict VARCHAR(32);
ALTER TABLE reviews ADD COLUMN review_title VARCHAR(240);
ALTER TABLE reviews ADD COLUMN review_description VARCHAR(5000);

UPDATE reviews SET verdict = 'GO_FOR_IT', review_title = 'Legacy review', review_description = comment WHERE verdict IS NULL;

ALTER TABLE reviews MODIFY verdict VARCHAR(32) NOT NULL;
ALTER TABLE reviews MODIFY review_title VARCHAR(240) NOT NULL;
ALTER TABLE reviews MODIFY review_description VARCHAR(5000) NOT NULL;
ALTER TABLE reviews DROP COLUMN rating;
ALTER TABLE reviews DROP COLUMN comment;
