use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{FieldResult, GraphQLEnum, GraphQLInputObject, GraphQLObject};

use crate::db::models::{Friend, NewFriend};
use crate::db::schema::friends;

use super::message::*;
use super::user::*;

#[derive(GraphQLEnum, Debug, Clone)]
pub enum ScFriendStatus {
    Accept,
    Pending,
    Deny,
}

#[derive(GraphQLInputObject)]
pub struct ScNewFriend {
    pub username: String,
}

#[derive(GraphQLInputObject)]
pub struct ScUpdateFriend {
    pub target_id: i32,
    pub accept: bool,
}

#[derive(GraphQLInputObject)]
pub struct ScReadMessage {
    pub target_id: i32,
}

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScFriend {
    user: ScUserBasic,
    created_at: f64,
    status: ScFriendStatus,
    unread_message_count: i32,
}

fn convert_status_to_string(status: ScFriendStatus) -> String {
    match status {
        ScFriendStatus::Accept => String::from("accept"),
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

fn convert_to_sc_friend(conn: &PgConnection, friend: &Friend) -> ScFriend {
    ScFriend {
        user: get_user_basic(conn, friend.target_id).unwrap(),
        created_at: friend.created_at.timestamp_millis() as f64,
        status: convert_status_to_enum(friend.status.clone()),
        unread_message_count: get_messages_count(
            conn,
            friend.user_id,
            friend.target_id,
            friend.last_read_at,
        ),
    }
}

pub fn get_friends(conn: &PgConnection, uid: i32) -> Vec<ScFriend> {
    use self::friends::dsl::*;

    friends
        .filter(user_id.eq(uid))
        .filter(status.ne(convert_status_to_string(ScFriendStatus::Deny)))
        .load::<Friend>(conn)
        .unwrap()
        .iter()
        .map(|friend| convert_to_sc_friend(conn, friend))
        .collect()
}

pub fn get_friend_ids(conn: &PgConnection, uid: i32) -> Vec<i32> {
    use self::friends::dsl::*;

    friends
        .filter(user_id.eq(uid))
        .filter(status.eq(convert_status_to_string(ScFriendStatus::Accept)))
        .load::<Friend>(conn)
        .unwrap()
        .iter()
        .map(|friend| friend.target_id)
        .collect()
}

pub fn apply_friend(conn: &PgConnection, uid: i32, tid: i32) -> FieldResult<ScFriend> {
    let new_friend = NewFriend {
        user_id: tid,
        target_id: uid,
        created_at: Utc::now().naive_utc(),
        status: &convert_status_to_string(ScFriendStatus::Pending),
    };

    let friend = diesel::insert_into(friends::table)
        .values(&new_friend)
        .get_result::<Friend>(conn)?;

    Ok(convert_to_sc_friend(conn, &friend))
}

pub fn accept_friend(conn: &PgConnection, uid: i32, tid: i32) -> FieldResult<ScFriend> {
    use self::friends::dsl::*;

    diesel::update(friends.filter(user_id.eq(uid)).filter(target_id.eq(tid)))
        .set(status.eq(&convert_status_to_string(ScFriendStatus::Accept)))
        .execute(conn)?;

    diesel::delete(friends.filter(user_id.eq(tid)).filter(target_id.eq(uid)))
        .execute(conn)
        .unwrap();

    let new_friend = NewFriend {
        user_id: tid,
        target_id: uid,
        created_at: Utc::now().naive_utc(),
        status: &convert_status_to_string(ScFriendStatus::Accept),
    };

    let friend = diesel::insert_into(friends)
        .values(&new_friend)
        .get_result::<Friend>(conn)?;

    Ok(convert_to_sc_friend(conn, &friend))
}

pub fn read_message(conn: &PgConnection, uid: i32, tid: i32) -> FieldResult<ScFriend> {
    use self::friends::dsl::*;

    let friend = diesel::update(friends.filter(user_id.eq(uid)).filter(target_id.eq(tid)))
        .set(last_read_at.eq(Utc::now().naive_utc()))
        .get_result::<Friend>(conn)?;

    Ok(convert_to_sc_friend(conn, &friend))
}

pub fn delete_friend(conn: &PgConnection, uid: i32, tid: i32) {
    use self::friends::dsl::*;

    diesel::delete(friends.filter(user_id.eq(uid)).filter(target_id.eq(tid)))
        .execute(conn)
        .unwrap();

    diesel::delete(friends.filter(user_id.eq(tid)).filter(target_id.eq(uid)))
        .execute(conn)
        .unwrap();
}
