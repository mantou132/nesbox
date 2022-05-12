use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLEnum, GraphQLInputObject, GraphQLObject};

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
pub struct ScNewUser {
    username: String,
    password: String,
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

pub fn get_user(conn: &PgConnection, u: &str) -> ScUser {
    use self::users::dsl::*;

    let user = users
        .filter(deleted_at.is_null())
        .filter(username.eq(u))
        .get_result::<User>(conn)
        .expect("Error loading posts");

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

pub fn create_user(conn: &PgConnection, req: ScNewUser) -> ScUser {
    let new_user = NewUser {
        username: &req.username,
        password: &req.password,
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

    ScUser {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        settings: user.settings.map(|v| v.to_string()),
        created_at: user.created_at.timestamp_millis() as f64,
        updated_at: user.updated_at.timestamp_millis() as f64,
        status: convert_status_to_enum(user.status),
    }
}
