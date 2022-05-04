use super::schema::comments;
use super::schema::games;
use super::schema::users;

use chrono::NaiveDateTime;
use serde_json::value::Value;

#[derive(Queryable)]
pub struct Comment {
    pub user_id: i32,
    pub game_id: i32,
    pub body: String,
    pub like: bool,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "comments"]
pub struct NewComment<'a> {
    pub user_id: i32,
    pub game_id: i32,
    pub body: &'a str,
    pub like: bool,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Queryable)]
pub struct Game {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub preview: String,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub rom: String,
}

#[derive(Insertable)]
#[table_name = "games"]
pub struct NewGame<'a> {
    pub name: &'a str,
    pub description: &'a str,
    pub preview: &'a str,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub rom: &'a str,
}

#[derive(Queryable)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password: String,
    pub nickname: String,
    pub settings: Option<Value>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub status: String,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub username: &'a str,
    pub password: &'a str,
    pub nickname: &'a str,
    pub status: &'a str,
    pub settings: Option<&'a Value>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
