-- Align the migrated schema with the current JPA model.

ALTER TABLE books
    ADD COLUMN published BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE reviews
    ADD COLUMN message VARCHAR(5000);

UPDATE reviews
SET message = review_description
WHERE message IS NULL;

ALTER TABLE reviews
    DROP COLUMN review_title,
    DROP COLUMN review_description;
