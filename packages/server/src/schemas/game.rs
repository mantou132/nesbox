use chrono::{NaiveDate, NaiveDateTime};
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use crate::db::models::{Game, NewGame};
use crate::db::schema::games;

#[derive(GraphQLObject)]
pub struct ScGame {
    id: i32,
    name: String,
    description: String,
    preview: String,
    created_at: NaiveDateTime,
    updated_at: NaiveDateTime,
    rom: String,
}

#[derive(GraphQLInputObject)]
pub struct ScNewGame {
    name: String,
    description: String,
    preview: String,
    rom: String,
}

pub fn get_games(conn: &PgConnection) -> Vec<ScGame> {
    use self::games::dsl::*;

    games
        .filter(deleted_at.is_null())
        .limit(5)
        .load::<Game>(conn)
        .expect("Error loading posts")
        .iter()
        .map(|game| ScGame {
            id: game.id,
            name: game.name.clone(),
            description: game.description.clone(),
            preview: game.preview.clone(),
            rom: game.rom.clone(),
            updated_at: game.updated_at,
            created_at: game.created_at,
        })
        .collect()
}

pub fn create_game(conn: &PgConnection, req: ScNewGame) -> ScGame {
    let new_game = NewGame {
        name: &req.name,
        description: &req.description,
        preview: &req.preview,
        rom: &req.rom,
        deleted_at: None,
        created_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
        updated_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
    };

    let game = diesel::insert_into(games::table)
        .values(&new_game)
        .get_result::<Game>(conn)
        .expect("Error saving new game");

    ScGame {
        id: game.id,
        name: game.name,
        description: game.description,
        preview: game.preview,
        created_at: game.created_at,
        updated_at: game.updated_at,
        rom: game.rom,
    }
}
