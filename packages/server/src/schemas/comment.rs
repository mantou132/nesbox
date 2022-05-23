use chrono::{NaiveDateTime, Utc};
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use crate::db::models::{Comment, NewComment};
use crate::db::schema::comments;

use super::user::*;

#[derive(GraphQLObject)]
pub struct ScComment {
    user: ScUserBasic,
    game_id: i32,
    body: String,
    like: bool,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScNewComment {
    game_id: i32,
    body: String,
    like: bool,
}

#[derive(GraphQLInputObject)]
pub struct ScCommentsReq {
    pub game_id: i32,
}

fn convert_to_sc_comment(conn: &PgConnection, comment: &Comment) -> ScComment {
    ScComment {
        user: get_user_basic(conn, comment.user_id),
        game_id: comment.game_id,
        body: comment.body.clone(),
        like: comment.like,
        created_at: comment.created_at.timestamp_millis() as f64,
        updated_at: comment.updated_at.timestamp_millis() as f64,
    }
}

pub fn get_comments(conn: &PgConnection, gid: i32) -> Vec<ScComment> {
    use self::comments::dsl::*;

    comments
        .filter(deleted_at.is_null())
        .filter(game_id.eq(gid))
        .load::<Comment>(conn)
        .expect("Error loading comments")
        .iter()
        .map(|comment| convert_to_sc_comment(conn, comment))
        .collect()
}

pub fn create_comment(conn: &PgConnection, uid: i32, req: &ScNewComment) -> ScComment {
    use self::comments::dsl::*;

    let c = comments
        .filter(user_id.eq(uid))
        .filter(game_id.eq(req.game_id))
        .get_results::<Comment>(conn)
        .expect("Error find comments");

    if c.len() != 0 {
        return update_comment(conn, uid, req);
    }

    let new_comment = NewComment {
        user_id: uid,
        game_id: req.game_id,
        body: &req.body,
        like: req.like,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let comment = diesel::insert_into(comments)
        .values(&new_comment)
        .get_result::<Comment>(conn)
        .expect("Error saving new comment");

    convert_to_sc_comment(conn, &comment)
}

pub fn update_comment(conn: &PgConnection, uid: i32, req: &ScNewComment) -> ScComment {
    use self::comments::dsl::*;

    let comment = diesel::update(
        comments
            .filter(deleted_at.is_null())
            .filter(game_id.eq(req.game_id))
            .filter(user_id.eq(uid)),
    )
    .set((
        body.eq(req.body.clone()),
        like.eq(req.like),
        updated_at.eq(Utc::now().naive_utc()),
        deleted_at.eq(None::<NaiveDateTime>),
    ))
    .get_result::<Comment>(conn)
    .expect("Error update comment");

    convert_to_sc_comment(conn, &comment)
}
