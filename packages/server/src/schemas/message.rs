use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use crate::db::models::{Message, NewMessage};
use crate::db::schema::messages;

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScMessage {
    id: i32,
    body: String,
    pub target_id: i32,
    user_id: i32,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScNewMessage {
    body: String,
    target_id: i32,
}

pub fn get_messages(conn: &PgConnection, uid: i32, tid: i32) -> Vec<ScMessage> {
    use self::messages::dsl::*;

    messages
        .filter(deleted_at.is_null())
        .filter(user_id.eq(uid))
        .filter(target_id.eq(tid))
        .load::<Message>(conn)
        .expect("Error loading messages")
        .iter()
        .map(|message| ScMessage {
            id: message.id,
            user_id: message.user_id,
            target_id: message.target_id,
            body: message.body.clone(),
            created_at: message.created_at.timestamp_millis() as f64,
            updated_at: message.updated_at.timestamp_millis() as f64,
        })
        .collect()
}

pub fn create_message(conn: &PgConnection, user_id: i32, req: ScNewMessage) -> ScMessage {
    let new_message = NewMessage {
        user_id,
        target_id: req.target_id,
        body: &req.body,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let message = diesel::insert_into(messages::table)
        .values(&new_message)
        .get_result::<Message>(conn)
        .expect("Error saving new message");

    ScMessage {
        id: message.id,
        user_id: message.user_id,
        target_id: message.target_id,
        body: message.body,
        created_at: message.created_at.timestamp_millis() as f64,
        updated_at: message.updated_at.timestamp_millis() as f64,
    }
}
