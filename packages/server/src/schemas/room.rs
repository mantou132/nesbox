use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use super::invite::*;
use super::playing::*;
use crate::db::models::{NewRoom, Room};
use crate::db::schema::rooms;

#[derive(GraphQLObject)]
pub struct ScRoom {
    id: i32,
    game_id: i32,
    private: bool,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScNewRoom {
    pub game_id: i32,
    pub private: bool,
}

pub fn get_room(conn: &PgConnection, rid: i32) -> ScRoom {
    use self::rooms::dsl::*;

    let room = rooms
        .filter(id.eq(rid))
        .get_result::<Room>(conn)
        .expect("Error loading room");

    ScRoom {
        id: room.id,
        private: room.private,
        game_id: room.game_id,
        created_at: room.created_at.timestamp_millis() as f64,
        updated_at: room.updated_at.timestamp_millis() as f64,
    }
}

pub fn get_rooms(conn: &PgConnection) -> Vec<ScRoom> {
    use self::rooms::dsl::*;

    rooms
        .filter(deleted_at.is_null())
        .filter(private.eq(false))
        .load::<Room>(conn)
        .expect("Error loading room")
        .iter()
        .map(|room| ScRoom {
            id: room.id,
            private: room.private,
            game_id: room.game_id,
            created_at: room.created_at.timestamp_millis() as f64,
            updated_at: room.updated_at.timestamp_millis() as f64,
        })
        .collect()
}

pub fn create_room(conn: &PgConnection, req: ScNewRoom) -> ScRoom {
    let new_room = NewRoom {
        game_id: req.game_id,
        private: req.private,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let room = diesel::insert_into(rooms::table)
        .values(&new_room)
        .get_result::<Room>(conn)
        .expect("Error saving new room");

    ScRoom {
        id: room.id,
        game_id: room.game_id,
        private: room.private,
        created_at: room.created_at.timestamp_millis() as f64,
        updated_at: room.updated_at.timestamp_millis() as f64,
    }
}

pub fn enter_room(conn: &PgConnection, uid: i32, rid: i32) -> String {
    delete_playing(conn, uid);
    create_playing(conn, uid, rid);

    "Ok".into()
}

pub fn leave_room(conn: &PgConnection, uid: i32, _rid: i32) -> String {
    delete_playing(conn, uid);
    delete_invite(conn, uid);

    "Ok".into()
}
