use chrono::Utc;
use data_encoding::HEXUPPER;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLEnum, GraphQLInputObject, GraphQLObject};
use ring::{digest, pbkdf2};
use std::num::NonZeroU32;

use crate::auth::UserToken;
use crate::db::models::{NewUser, User};
use crate::db::schema::users;

#[derive(GraphQLEnum)]
enum UserStatus {
    Online,
    Offline,
}

#[derive(GraphQLObject)]
pub struct ScUser {
    id: i32,
    username: String,
    nickname: String,
    settings: Option<String>,
    created_at: f64,
    updated_at: f64,
    status: UserStatus,
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

fn convert_status_to_string(status: UserStatus) -> String {
    match status {
        UserStatus::Online => String::from("online"),
        UserStatus::Offline => String::from("offline"),
    }
}

fn convert_status_to_enum(status: String) -> UserStatus {
    match status.as_str() {
        "online" => UserStatus::Online,
        "offline" => UserStatus::Offline,
        _ => UserStatus::Offline,
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

pub fn get_user(conn: &PgConnection, u: &str) -> ScUser {
    use self::users::dsl::*;

    let user = users
        .filter(deleted_at.is_null())
        .filter(username.eq(u))
        .get_result::<User>(conn)
        .expect("Error loading user");

    ScUser {
        id: user.id,
        username: user.username.clone(),
        nickname: user.nickname.clone(),
        settings: user.settings.clone().map(|v| v.to_string()),
        created_at: user.created_at.timestamp_millis() as f64,
        updated_at: user.updated_at.timestamp_millis() as f64,
        status: convert_status_to_enum(user.status.clone()),
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

    let user = ScUser {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        settings: user.settings.map(|v| v.to_string()),
        created_at: user.created_at.timestamp_millis() as f64,
        updated_at: user.updated_at.timestamp_millis() as f64,
        status: convert_status_to_enum(user.status),
    };

    ScLoginResp {
        user,
        token: UserToken::generate_token(secret, &req.username),
    }
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
        status: &convert_status_to_string(UserStatus::Offline),
    };

    let user = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result::<User>(conn)
        .expect("Error saving new user");

    let user = ScUser {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        settings: user.settings.map(|v| v.to_string()),
        created_at: user.created_at.timestamp_millis() as f64,
        updated_at: user.updated_at.timestamp_millis() as f64,
        status: convert_status_to_enum(user.status),
    };

    ScLoginResp {
        user,
        token: UserToken::generate_token(secret, &req.username),
    }
}
