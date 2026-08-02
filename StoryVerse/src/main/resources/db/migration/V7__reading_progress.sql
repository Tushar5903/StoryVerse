CREATE TABLE reading_progress (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  book_id BIGINT NOT NULL,
  chapter_id BIGINT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT uk_reading_progress_user_chapter UNIQUE (user_id, chapter_id),
  CONSTRAINT fk_reading_progress_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reading_progress_book FOREIGN KEY (book_id) REFERENCES books(id),
  CONSTRAINT fk_reading_progress_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
CREATE INDEX idx_reading_progress_user_book ON reading_progress(user_id, book_id);
