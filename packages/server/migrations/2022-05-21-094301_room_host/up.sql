ALTER TABLE rooms ADD host integer NOT NULL;

ALTER TABLE rooms ADD CONSTRAINT FK_194 FOREIGN KEY ( host ) REFERENCES users ( "id" );
CREATE INDEX FK_194 ON rooms ( host );