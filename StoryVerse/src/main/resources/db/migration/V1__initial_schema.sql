CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  enabled BOOLEAN NOT NULL,
  email_verified BOOLEAN NOT NULL,
  banned BOOLEAN NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT uk_users_email UNIQUE (email)
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE authors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  biography VARCHAR(2000),
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL
);
CREATE INDEX idx_authors_name ON authors(name);

CREATE TABLE books (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(240) NOT NULL,
  synopsis VARCHAR(4000) NOT NULL,
  cover_image_path VARCHAR(500),
  status VARCHAR(32) NOT NULL,
  owner_id BIGINT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT fk_books_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_status ON books(status);

CREATE TABLE book_authors (
  book_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  PRIMARY KEY (book_id, author_id),
  CONSTRAINT fk_book_authors_book FOREIGN KEY (book_id) REFERENCES books(id),
  CONSTRAINT fk_book_authors_author FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  book_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(3000) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT uk_reviews_user_book UNIQUE (user_id, book_id),
  CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES books(id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_reviews_book ON reviews(book_id);

CREATE TABLE verification_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  expiry_date TIMESTAMP(6) NOT NULL,
  used BOOLEAN NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT fk_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_verification_token ON verification_tokens(token);

CREATE TABLE refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  revoked BOOLEAN NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);

CREATE TABLE password_reset_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  used BOOLEAN NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  version BIGINT NOT NULL,
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
