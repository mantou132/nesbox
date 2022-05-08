use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use crate::db::models::{Comment, NewComment};
use crate::db::schema::comments;

#[derive(GraphQLObject)]
pub struct ScComment {
    user_id: i32,
    game_id: i32,
    body: String,
    like: bool,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScNewComment {
    user_id: i32,
    game_id: i32,
    body: String,
    like: bool,
}

pub fn get_comments(conn: &PgConnection, gid: i32) -> Vec<ScComment> {
    use self::comments::dsl::*;

    comments
        .filter(deleted_at.is_null())
        .filter(self::comments::dsl::game_id.eq(gid))
        .load::<Comment>(conn)
        .expect("Error loading posts")
        .iter()
        .map(|comment| ScComment {
            user_id: comment.user_id,
            game_id: comment.game_id,
            body: comment.body.clone(),
            like: comment.like,
            created_at: comment.created_at.timestamp_millis() as f64,
            updated_at: comment.updated_at.timestamp_millis() as f64,
        })
        .collect()
}

pub fn create_comment(conn: &PgConnection, req: ScNewComment) -> ScComment {
    let new_comment = NewComment {
        user_id: req.user_id,
        game_id: req.game_id,
        body: &req.body,
        like: req.like,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let comment = diesel::insert_into(comments::table)
        .values(&new_comment)
        .get_result::<Comment>(conn)
        .expect("Error saving new comment");

    ScComment {
        user_id: comment.user_id,
        game_id: comment.game_id,
        body: comment.body,
        like: comment.like,
        created_at: comment.created_at.timestamp_millis() as f64,
        updated_at: comment.updated_at.timestamp_millis() as f64,
    }
}
