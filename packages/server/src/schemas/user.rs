use chrono::Utc;
use data_encoding::HEXUPPER;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLEnum, GraphQLInputObject, GraphQLObject};
use ring::{digest, pbkdf2};
use std::num::NonZeroU32;

use super::notify::*;
use super::playing::*;
use super::room::*;
use crate::auth::UserToken;
use crate::db::models::{NewUser, User};
use crate::db::schema::users;

#[derive(GraphQLEnum, Debug, Clone)]
pub enum ScUserStatus {
    Online,
    Offline,
}

#[derive(GraphQLObject)]
pub struct ScUser {
    pub id: i32,
    pub username: String,
    pub nickname: String,
    pub playing: Option<ScRoomBasic>,
    settings: Option<String>,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScUpdateUserReq {
    nickname: String,
    settings: Option<String>,
}

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScUserBasic {
    pub id: i32,
    pub username: String,
    pub nickname: String,
    pub status: ScUserStatus,
    pub playing: Option<ScRoomBasic>,
}

#[derive(GraphQLInputObject)]
pub struct ScLoginReq {
    username: String,
    password: String,
}

#[derive(GraphQLObject)]
pub struct ScLoginResp {
    user: ScUser,
    token: String,
}

pub fn get_user_status(uid: i32) -> ScUserStatus {
    if has_user(uid) {
        ScUserStatus::Online
    } else {
        ScUserStatus::Offline
    }
}

fn hash_password(password: &str) -> String {
    let mut pbkdf2_hash = [0u8; digest::SHA512_OUTPUT_LEN];
    pbkdf2::derive(
        pbkdf2::PBKDF2_HMAC_SHA512,
        NonZeroU32::new(1).unwrap(),
        &[],
        password.as_bytes(),
        &mut pbkdf2_hash,
    );
    HEXUPPER.encode(&pbkdf2_hash)
}

fn convert_to_sc_user(conn: &PgConnection, user: &User) -> ScUser {
    ScUser {
        id: user.id,
        username: user.username.clone(),
        nickname: user.nickname.clone(),
        settings: user.settings.clone().map(|v| v.to_string()),
        created_at: user.created_at.timestamp_millis() as f64,
        updated_at: user.updated_at.timestamp_millis() as f64,
        playing: get_playing(conn, user.id),
    }
}

pub fn get_account(conn: &PgConnection, uid: i32) -> ScUser {
    use self::users::dsl::*;

    let user = users
        .filter(deleted_at.is_null())
        .filter(id.eq(uid))
        .get_result::<User>(conn)
        .expect("Error loading user");

    convert_to_sc_user(conn, &user)
}

pub fn update_user(conn: &PgConnection, uid: i32, req: &ScUpdateUserReq) -> ScUser {
    use self::users::dsl::*;

    let user = diesel::update(users.filter(deleted_at.is_null()).filter(id.eq(uid)))
        .set((
            nickname.eq(req.nickname.clone()),
            settings.eq(req
                .settings
                .as_ref()
                .map(|s| serde_json::from_str::<serde_json::Value>(&s).unwrap_or_default())),
            updated_at.eq(Utc::now().naive_utc()),
        ))
        .get_result::<User>(conn)
        .expect("Error update user");

    convert_to_sc_user(conn, &user)
}

pub fn get_user_basic(conn: &PgConnection, uid: i32) -> ScUserBasic {
    use self::users::dsl::*;

    let user = users
        .filter(deleted_at.is_null())
        .filter(id.eq(uid))
        .get_result::<User>(conn)
        .expect("Error loading user");

    ScUserBasic {
        id: user.id,
        username: user.username.clone(),
        nickname: user.nickname.clone(),
        status: get_user_status(uid),
        playing: get_playing(conn, user.id),
    }
}

pub fn login(conn: &PgConnection, req: ScLoginReq, secret: &str) -> ScLoginResp {
    use self::users::dsl::*;

    let user = users
        .filter(deleted_at.is_null())
        .filter(username.eq(&req.username))
        .filter(password.eq(&hash_password(&req.password)))
        .get_result::<User>(conn)
        .expect("Error saving new user");

    let user = convert_to_sc_user(conn, &user);

    let token = UserToken::generate_token(secret, &user);

    ScLoginResp { user, token }
}

pub fn register(conn: &PgConnection, req: ScLoginReq, secret: &str) -> ScLoginResp {
    let new_user = NewUser {
        username: &req.username,
        password: &hash_password(&req.password),
        nickname: &req.username,
        settings: None,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let user = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result::<User>(conn)
        .expect("Error saving new user");

    let user = convert_to_sc_user(conn, &user);

    let token = UserToken::generate_token(secret, &user);

    ScLoginResp { user, token }
}
