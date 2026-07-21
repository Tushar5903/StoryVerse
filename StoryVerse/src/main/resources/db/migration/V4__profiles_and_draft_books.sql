-- Support user profiles and the existing two-step user-book creation flow.

ALTER TABLE users
    ADD COLUMN bio VARCHAR(2000),
    ADD COLUMN profile_image VARCHAR(500);

ALTER TABLE books
    MODIFY description VARCHAR(4000) NULL;
