ALTER TABLE friends ADD last_read integer;

ALTER TABLE friends ADD CONSTRAINT FK_197 FOREIGN KEY ( last_read ) REFERENCES messages ( "id" );
CREATE INDEX FK_197 ON friends ( last_read );