use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;

use super::room::*;
use crate::db::models::{NewPlaying, Playing};
use crate::db::schema::playing;

pub fn get_playing(conn: &PgConnection, uid: i32) -> Option<ScRoomBasic> {
    use self::playing::dsl::*;

    playing
        .filter(user_id.eq(uid))
        .get_result::<Playing>(conn)
        .optional()
        .expect("Error loading invite")
        .map(|row| get_room(conn, row.room_id))
}

pub fn get_room_user_ids(conn: &PgConnection, rid: i32) -> Vec<i32> {
    use self::playing::dsl::*;

    playing
        .select(user_id)
        .filter(room_id.eq(rid))
        .load(conn)
        .expect("Error loading room users")
}

pub fn create_playing(conn: &PgConnection, uid: i32, rid: i32) -> String {
    let new_playing = NewPlaying {
        room_id: rid,
        user_id: uid,
        created_at: Utc::now().naive_utc(),
    };

    diesel::insert_into(playing::table)
        .values(&new_playing)
        .execute(conn)
        .expect("Error saving new invite");

    "Ok".into()
}

pub fn delete_playing(conn: &PgConnection, uid: i32) -> String {
    use self::playing::dsl::*;

    diesel::delete(playing.filter(user_id.eq(uid)))
        .execute(conn)
        .expect("Error delete playing");

    "Ok".into()
}
