-- Distinguish platform-user authors from admin-managed author records.

ALTER TABLE authors
    ADD COLUMN user_id BIGINT NULL,
    ADD COLUMN author_type VARCHAR(16) NOT NULL DEFAULT 'ADMIN';

ALTER TABLE authors
    ADD CONSTRAINT fk_authors_user FOREIGN KEY (user_id) REFERENCES users(id);

CREATE UNIQUE INDEX uk_authors_user_id ON authors(user_id);
