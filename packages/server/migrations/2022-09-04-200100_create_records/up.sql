CREATE TABLE records
(
 user_id            integer NOT NULL,
 game_id            integer NOT NULL,
 last_play_start_at timestamp NOT NULL,
 last_play_end_at   timestamp NULL,
 play_total         bigint NOT NULL,
 CONSTRAINT PK_1 PRIMARY KEY ( user_id, game_id ),
 CONSTRAINT FK_17 FOREIGN KEY ( user_id ) REFERENCES users ( "id" ),
 CONSTRAINT FK_18 FOREIGN KEY ( game_id ) REFERENCES games ( "id" )
);

CREATE INDEX FK_1 ON records
(
 user_id
);

CREATE INDEX FK_3 ON records
(
 game_id
);
