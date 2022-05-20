use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use super::invite::*;
use super::notify::*;
use super::playing::*;
use super::user::*;
use crate::db::models::{NewRoom, Room};
use crate::db::schema::rooms;

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScRoomBasic {
    pub id: i32,
    pub game_id: i32,
    pub private: bool,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLObject)]
pub struct ScRoom {
    pub id: i32,
    pub game_id: i32,
    pub private: bool,
    created_at: f64,
    updated_at: f64,
    users: Vec<ScUserBasic>,
}

#[derive(GraphQLInputObject)]
pub struct ScNewRoom {
    pub game_id: i32,
    pub private: bool,
}

pub fn convert_to_sc_room_basic(room: &Room) -> ScRoomBasic {
    ScRoomBasic {
        id: room.id,
        private: room.private,
        game_id: room.game_id,
        created_at: room.created_at.timestamp_millis() as f64,
        updated_at: room.updated_at.timestamp_millis() as f64,
    }
}

pub fn convert_to_sc_room(conn: &PgConnection, room: &Room) -> ScRoom {
    ScRoom {
        id: room.id,
        private: room.private,
        game_id: room.game_id,
        created_at: room.created_at.timestamp_millis() as f64,
        updated_at: room.updated_at.timestamp_millis() as f64,
        users: get_room_user_ids(conn, room.id)
            .into_iter()
            .filter(|user_id| has_user(*user_id))
            .map(|user_id| get_user_basic(conn, user_id))
            .collect(),
    }
}

pub fn get_room(conn: &PgConnection, rid: i32) -> ScRoomBasic {
    use self::rooms::dsl::*;

    let room = rooms
        .filter(id.eq(rid))
        .get_result::<Room>(conn)
        .expect("Error loading room");

    convert_to_sc_room_basic(&room)
}

pub fn get_rooms(conn: &PgConnection) -> Vec<ScRoom> {
    use self::rooms::dsl::*;

    rooms
        .filter(deleted_at.is_null())
        .filter(private.eq(false))
        .limit(100)
        .load::<Room>(conn)
        .expect("Error loading room")
        .iter()
        .map(|room| convert_to_sc_room(conn, room))
        .collect()
}

pub fn create_room(conn: &PgConnection, uid: i32, req: &ScNewRoom) -> ScRoom {
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

    enter_room(conn, uid, room.id);

    convert_to_sc_room(conn, &room)
}

pub fn delete_room(conn: &PgConnection, rid: i32) -> String {
    use self::rooms::dsl::*;

    diesel::delete(rooms.filter(id.eq(rid)))
        .execute(conn)
        .expect("Error delete favorite");

    "Ok".into()
}

pub fn enter_room(conn: &PgConnection, uid: i32, rid: i32) -> String {
    delete_playing(conn, uid);
    create_playing(conn, uid, rid);
    delete_invite(conn, uid, true);

    "Ok".into()
}

pub fn leave_room(conn: &PgConnection, uid: i32, _rid: i32) -> String {
    delete_playing(conn, uid);
    delete_invite(conn, uid, false);

    "Ok".into()
}
