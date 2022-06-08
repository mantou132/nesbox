use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{FieldResult, GraphQLInputObject};

use super::room::*;
use crate::db::models::{NewPlaying, Playing};
use crate::db::schema::playing;

#[derive(GraphQLInputObject)]
pub struct ScUpdatePlaying {
    pub room_id: i32,
}

pub fn get_playing(conn: &PgConnection, uid: i32) -> Option<ScRoomBasic> {
    use self::playing::dsl::*;

    playing
        .filter(user_id.eq(uid))
        .get_result::<Playing>(conn)
        .optional()
        .unwrap()
        .map(|row| get_room(conn, row.room_id).unwrap())
}

pub fn get_room_user_ids(conn: &PgConnection, rid: i32) -> Vec<i32> {
    use self::playing::dsl::*;

    playing
        .select(user_id)
        .filter(room_id.eq(rid))
        .load(conn)
        .unwrap()
}

pub fn create_playing(conn: &PgConnection, uid: i32, rid: i32) -> FieldResult<i32> {
    let new_playing = NewPlaying {
        room_id: rid,
        user_id: uid,
        created_at: Utc::now().naive_utc(),
    };

    diesel::insert_into(playing::table)
        .values(&new_playing)
        .execute(conn)
        .map(|_| rid as i32)
        .map_err(|err| err.into())
}

pub fn delete_playing(conn: &PgConnection, uid: i32) {
    use self::playing::dsl::*;

    diesel::delete(playing.filter(user_id.eq(uid)))
        .execute(conn)
        .unwrap();
}

pub fn delete_playing_with_room(conn: &PgConnection, rid: i32) {
    use self::playing::dsl::*;

    diesel::delete(playing.filter(room_id.eq(rid)))
        .execute(conn)
        .unwrap();
}
