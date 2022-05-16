use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLEnum, GraphQLObject};

use crate::db::models::{Friend, NewFriend};
use crate::db::schema::friends;

use super::room::*;
use super::user::*;

#[derive(GraphQLEnum)]
pub enum ScFriendStatus {
    Accept,
    Pending,
    Deny,
}

#[derive(GraphQLObject)]
pub struct ScFriend {
    target_id: i32,
    created_at: f64,
    status: ScFriendStatus,
    user_status: super::user::ScUserStatus,
    playing: Option<ScRoom>,
}

fn convert_status_to_string(status: ScFriendStatus) -> String {
    match status {
        ScFriendStatus::Accept => String::from("online"),
        ScFriendStatus::Pending => String::from("pending"),
        ScFriendStatus::Deny => String::from("deny"),
    }
}

fn convert_status_to_enum(status: String) -> ScFriendStatus {
    match status.as_str() {
        "accept" => ScFriendStatus::Accept,
        "pending" => ScFriendStatus::Pending,
        _ => ScFriendStatus::Deny,
    }
}

pub fn get_friends(conn: &PgConnection, uid: i32) -> Vec<ScFriend> {
    use self::friends::dsl::*;

    friends
        .filter(user_id.eq(uid))
        .filter(status.ne(convert_status_to_string(ScFriendStatus::Deny)))
        .load::<Friend>(conn)
        .expect("Error loading friend")
        .iter()
        .map(|friend| {
            let user = get_user_basic(conn, friend.target_id);

            ScFriend {
                playing: user.playing,
                user_status: user.status,
                target_id: friend.target_id,
                created_at: friend.created_at.timestamp_millis() as f64,
                status: convert_status_to_enum(friend.status.clone()),
            }
        })
        .collect()
}

pub fn apply_friend(conn: &PgConnection, uid: i32, tid: i32) -> String {
    let new_friend = NewFriend {
        user_id: tid,
        target_id: uid,
        created_at: Utc::now().naive_utc(),
        status: &convert_status_to_string(ScFriendStatus::Pending),
    };

    diesel::insert_into(friends::table)
        .values(&vec![new_friend])
        .execute(conn)
        .expect("Error saving new friend");

    "Ok".into()
}

pub fn accept_friend(conn: &PgConnection, uid: i32, tid: i32) -> String {
    use self::friends::dsl::*;

    diesel::update(friends.filter(user_id.eq(uid)).filter(target_id.eq(tid)))
        .set(status.eq(&convert_status_to_string(ScFriendStatus::Accept)))
        .execute(conn)
        .expect("Error saving new friend");

    let new_friend = NewFriend {
        user_id: tid,
        target_id: uid,
        created_at: Utc::now().naive_utc(),
        status: &convert_status_to_string(ScFriendStatus::Accept),
    };

    diesel::insert_into(friends)
        .values(&vec![new_friend])
        .execute(conn)
        .expect("Error saving new friend");

    "Ok".into()
}

pub fn delete_friend(conn: &PgConnection, uid: i32, tid: i32) -> String {
    use self::friends::dsl::*;

    diesel::delete(friends.filter(user_id.eq(uid)).filter(target_id.eq(tid)))
        .execute(conn)
        .expect("Error delete friend");

    diesel::delete(friends.filter(user_id.eq(tid)).filter(target_id.eq(uid)))
        .execute(conn)
        .expect("Error delete friend");

    "Ok".into()
}
