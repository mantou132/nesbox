ALTER TABLE friends DROP COLUMN last_read;

ALTER TABLE friends ADD COLUMN last_read_at TIMESTAMP NOT NULL DEFAULT now();