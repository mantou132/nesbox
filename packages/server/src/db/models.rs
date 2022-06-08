use super::schema::comments;
use super::schema::favorites;
use super::schema::friends;
use super::schema::games;
use super::schema::invites;
use super::schema::messages;
use super::schema::playing;
use super::schema::rooms;
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
    pub screenshots: Option<String>,
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
    pub screenshots: Option<&'a str>,
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
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub username: &'a str,
    pub password: &'a str,
    pub nickname: &'a str,
    pub settings: Option<&'a Value>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Queryable)]
pub struct Message {
    pub id: i32,
    pub body: String,
    pub target_id: i32,
    pub user_id: i32,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "messages"]
pub struct NewMessage<'a> {
    pub body: &'a str,
    pub target_id: i32,
    pub user_id: i32,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Queryable)]
pub struct Favorite {
    pub user_id: i32,
    pub game_id: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "favorites"]
pub struct NewFavorite {
    pub user_id: i32,
    pub game_id: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Queryable)]
pub struct Room {
    pub id: i32,
    pub game_id: i32,
    pub private: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub host: i32,
}

#[derive(Insertable)]
#[table_name = "rooms"]
pub struct NewRoom {
    pub game_id: i32,
    pub private: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub host: i32,
}

#[derive(Queryable)]
pub struct Friend {
    pub user_id: i32,
    pub target_id: i32,
    pub created_at: NaiveDateTime,
    pub status: String,
    pub last_read_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "friends"]
pub struct NewFriend<'a> {
    pub user_id: i32,
    pub target_id: i32,
    pub created_at: NaiveDateTime,
    pub status: &'a str,
}

#[derive(Queryable)]
pub struct Playing {
    pub user_id: i32,
    pub room_id: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "playing"]
pub struct NewPlaying {
    pub user_id: i32,
    pub room_id: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Queryable)]
pub struct Invite {
    pub id: i32,
    pub room_id: i32,
    pub target_id: i32,
    pub user_id: i32,
    pub created_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "invites"]
pub struct NewInvite {
    pub room_id: i32,
    pub target_id: i32,
    pub user_id: i32,
    pub created_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub updated_at: NaiveDateTime,
}
