use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use crate::db::models::{Game, NewGame};
use crate::db::schema::games;

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScGame {
    pub id: i32,
    name: String,
    description: String,
    preview: String,
    created_at: f64,
    updated_at: f64,
    rom: String,
    screenshots: Vec<String>,
}

#[derive(GraphQLInputObject, Debug, PartialEq)]
pub struct ScNewGame {
    pub name: String,
    pub description: String,
    pub preview: String,
    pub rom: String,
    pub screenshots: Vec<String>,
}

fn convert_to_sc_game(game: &Game) -> ScGame {
    ScGame {
        id: game.id,
        name: game.name.clone(),
        description: game.description.clone(),
        preview: game.preview.clone(),
        rom: game.rom.clone(),
        created_at: game.created_at.timestamp_millis() as f64,
        updated_at: game.updated_at.timestamp_millis() as f64,
        screenshots: game
            .screenshots
            .clone()
            .unwrap_or_default()
            .split(",")
            .map(|url| url.into())
            .collect::<Vec<String>>(),
    }
}

pub fn get_games(conn: &PgConnection) -> Vec<ScGame> {
    use self::games::dsl::*;

    games
        .filter(deleted_at.is_null())
        .load::<Game>(conn)
        .expect("Error loading games")
        .iter()
        .map(|game| convert_to_sc_game(game))
        .collect()
}

pub fn get_game_from_name(conn: &PgConnection, n: &str) -> Option<ScGame> {
    use self::games::dsl::*;

    games
        .filter(deleted_at.is_null())
        .filter(name.eq(n))
        .get_result::<Game>(conn)
        .map(|game| convert_to_sc_game(&game))
        .ok()
}

pub fn create_game(conn: &PgConnection, req: &ScNewGame) -> ScGame {
    let screenshots_str = &req.screenshots.join(",");
    let new_game = NewGame {
        name: &req.name,
        description: &req.description,
        preview: &req.preview,
        rom: &req.rom,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
        screenshots: Some(screenshots_str),
    };

    let game = diesel::insert_into(games::table)
        .values(&new_game)
        .get_result::<Game>(conn)
        .expect("Error saving new game");

    convert_to_sc_game(&game)
}

pub fn update_game(conn: &PgConnection, gid: i32, req: &ScNewGame) -> ScGame {
    use self::games::dsl::*;
    
    let screenshots_str = &req.screenshots.join(",");
    let game = diesel::update(games.filter(deleted_at.is_null()).filter(id.eq(gid)))
        .set((
            description.eq(req.description.clone()),
            preview.eq(req.preview.clone()),
            rom.eq(req.rom.clone()),
            updated_at.eq(Utc::now().naive_utc()),
            screenshots.eq(Some(screenshots_str)),
        ))
        .get_result::<Game>(conn)
        .expect("Error update game");

    convert_to_sc_game(&game)
}
