use chrono::Utc;
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
    created_at: f64,
    updated_at: f64,
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
        .load::<Game>(conn)
        .expect("Error loading games")
        .iter()
        .map(|game| ScGame {
            id: game.id,
            name: game.name.clone(),
            description: game.description.clone(),
            preview: game.preview.clone(),
            rom: game.rom.clone(),
            created_at: game.created_at.timestamp_millis() as f64,
            updated_at: game.updated_at.timestamp_millis() as f64,
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
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
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
        created_at: game.created_at.timestamp_millis() as f64,
        updated_at: game.updated_at.timestamp_millis() as f64,
        rom: game.rom,
    }
}
