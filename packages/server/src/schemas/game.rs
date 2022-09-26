use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{FieldResult, GraphQLEnum, GraphQLInputObject, GraphQLObject};
use std::str::FromStr;
use std::string::ToString;
use strum::{Display, EnumString};

use crate::db::models::{Game, NewGame};
use crate::db::schema::games;

#[derive(GraphQLEnum, Debug, Clone, Display, EnumString, PartialEq)]
#[strum(serialize_all = "snake_case")]
pub enum ScGamePlatform {
    Arcade,
    Nes,
}

// https://zh.wikipedia.org/wiki/%E7%94%B5%E5%AD%90%E6%B8%B8%E6%88%8F%E7%B1%BB%E5%9E%8B#%E9%A1%9E%E5%9E%8B%E7%B8%AE%E5%AF%AB
#[derive(GraphQLEnum, Debug, Clone, Display, EnumString, PartialEq)]
#[strum(serialize_all = "snake_case")]
pub enum ScGameKind {
    // 动作，闯关冒险
    Act,
    // 格斗
    Ftg,
    // 角色扮演
    Rpg,
    // 及时策略
    Rts,
    // 回合制战略、棋牌
    Tbs,
    // 模擬
    Slg,
    // 射击
    Stg,
    // 运动
    Spg,
    // 桌游
    Tbg,
    // 益智解谜
    Pzg,
    // 赛车
    Rcg,
    // 其他
    Other,
}

#[derive(GraphQLEnum, Debug, Clone, Display, EnumString, PartialEq)]
#[strum(serialize_all = "snake_case")]
pub enum ScGameSeries {
    Tmnt,
    Tank,
    Nekketsu,
    Contra,
    Mario,
    DoubleDragon,
    AdventureIsland,
    // 松鼠大作战
    ChipDale,
    StreetFighter,
    MegaMan,
    // 忍者龙剑传
    NinjaGaiden,
    // 淘金者
    LodeRunner,
    DragonBall,
    SanGokuShi,
}

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
    platform: Option<ScGamePlatform>,
    series: Option<ScGameSeries>,
    kind: Option<ScGameKind>,
    max_player: Option<i32>,
}

#[derive(GraphQLInputObject, Debug, PartialEq)]
pub struct ScNewGame {
    pub name: String,
    pub description: String,
    pub preview: String,
    pub rom: String,
    pub screenshots: Vec<String>,
    pub platform: Option<ScGamePlatform>,
    pub series: Option<ScGameSeries>,
    pub kind: Option<ScGameKind>,
    pub max_player: Option<i32>,
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
        kind: game.kind.as_ref().map(|s| ScGameKind::from_str(s).unwrap()),
        max_player: game.max_player,
        platform: game
            .platform
            .as_ref()
            .map(|s| ScGamePlatform::from_str(s).unwrap()),
        series: game
            .series
            .as_ref()
            .map(|s| ScGameSeries::from_str(s).unwrap()),
    }
}

pub fn get_games(conn: &PgConnection) -> Vec<ScGame> {
    use self::games::dsl::*;

    games
        .filter(deleted_at.is_null())
        .load::<Game>(conn)
        .unwrap()
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

pub fn create_game(conn: &PgConnection, req: &ScNewGame) -> FieldResult<ScGame> {
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
        kind: req.kind.to_owned().map(|k| k.to_string()),
        platform: req.platform.to_owned().map(|k| k.to_string()),
        series: req.series.to_owned().map(|k| k.to_string()),
        max_player: req.max_player,
    };

    let game = diesel::insert_into(games::table)
        .values(&new_game)
        .get_result::<Game>(conn)?;

    Ok(convert_to_sc_game(&game))
}

pub fn update_game(conn: &PgConnection, gid: i32, req: &ScNewGame) -> FieldResult<ScGame> {
    use self::games::dsl::*;

    let screenshots_str = &req.screenshots.join(",");
    let game = diesel::update(games.filter(deleted_at.is_null()).filter(id.eq(gid)))
        .set((
            description.eq(req.description.clone()),
            preview.eq(req.preview.clone()),
            rom.eq(req.rom.clone()),
            updated_at.eq(Utc::now().naive_utc()),
            screenshots.eq(Some(screenshots_str)),
            kind.eq(req.kind.to_owned().map(|k| k.to_string())),
            platform.eq(req.platform.to_owned().map(|k| k.to_string())),
            series.eq(req.series.to_owned().map(|k| k.to_string())),
            max_player.eq(req.max_player),
        ))
        .get_result::<Game>(conn)?;

    Ok(convert_to_sc_game(&game))
}
