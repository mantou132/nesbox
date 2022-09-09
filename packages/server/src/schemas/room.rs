use chrono::Utc;
use diesel::dsl::*;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{FieldResult, GraphQLInputObject, GraphQLObject};

use super::invite::*;
use super::notify::*;
use super::playing::*;
use super::record::*;
use super::user::*;
use crate::db::models::{NewRoom, Room};
use crate::db::schema::rooms;

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScRoomBasic {
    pub id: i32,
    pub game_id: i32,
    pub private: bool,
    pub host: i32,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLObject)]
pub struct ScRoom {
    pub id: i32,
    pub game_id: i32,
    pub private: bool,
    pub host: i32,
    created_at: f64,
    updated_at: f64,
    users: Vec<ScUserBasic>,
    screenshot: Option<String>,
}

#[derive(GraphQLInputObject)]
pub struct ScNewRoom {
    pub game_id: i32,
    pub private: bool,
}

#[derive(GraphQLInputObject)]
pub struct ScUpdateRoom {
    pub id: i32,
    pub game_id: i32,
    pub private: bool,
    pub host: i32,
}

#[derive(GraphQLInputObject)]
pub struct ScUpdateRoomScreenshot {
    pub id: i32,
    pub screenshot: String,
}

pub fn convert_to_sc_room_basic(room: &Room) -> ScRoomBasic {
    ScRoomBasic {
        id: room.id,
        host: room.host,
        private: room.private,
        game_id: room.game_id,
        created_at: room.created_at.timestamp_millis() as f64,
        updated_at: room.updated_at.timestamp_millis() as f64,
    }
}

pub fn convert_to_sc_room(conn: &PgConnection, room: &Room) -> ScRoom {
    ScRoom {
        id: room.id,
        host: room.host,
        private: room.private,
        game_id: room.game_id,
        screenshot: room.screenshot.clone(),
        created_at: room.created_at.timestamp_millis() as f64,
        updated_at: room.updated_at.timestamp_millis() as f64,
        users: get_room_user_ids(conn, room.id)
            .into_iter()
            .filter(|user_id| has_user(*user_id))
            .map(|user_id| get_user_basic(conn, user_id).unwrap())
            .collect(),
    }
}

pub fn get_room(conn: &PgConnection, rid: i32) -> FieldResult<ScRoomBasic> {
    use self::rooms::dsl::*;

    let room = rooms.filter(id.eq(rid)).get_result::<Room>(conn)?;

    Ok(convert_to_sc_room_basic(&room))
}

pub fn get_outdated_rooms(conn: &PgConnection) -> Vec<ScRoomBasic> {
    use self::rooms::dsl::*;

    rooms
        .filter(deleted_at.is_null())
        .filter(updated_at.lt(now - 30.days()))
        .load::<Room>(conn)
        .unwrap()
        .iter()
        .map(|room| convert_to_sc_room_basic(&room))
        .filter(|room| !has_user(room.host))
        .collect()
}

pub fn get_rooms(conn: &PgConnection) -> Vec<ScRoom> {
    use self::rooms::dsl::*;

    rooms
        .filter(deleted_at.is_null())
        .filter(private.eq(false))
        .order(created_at.desc())
        .load::<Room>(conn)
        .unwrap()
        .iter()
        .map(|room| convert_to_sc_room(conn, room))
        .filter(|room| room.users.len() > 0)
        .collect()
}

pub fn create_room(conn: &PgConnection, uid: i32, req: &ScNewRoom) -> FieldResult<ScRoomBasic> {
    start_game(conn, uid, req.game_id);

    let new_room = NewRoom {
        game_id: req.game_id,
        private: req.private,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
        host: uid,
    };

    let room = diesel::insert_into(rooms::table)
        .values(&new_room)
        .get_result::<Room>(conn)?;

    enter_room(conn, uid, room.id);

    Ok(convert_to_sc_room_basic(&room))
}

pub fn update_room(conn: &PgConnection, uid: i32, req: &ScUpdateRoom) -> FieldResult<ScRoomBasic> {
    use self::rooms::dsl::*;

    let r = rooms
        .filter(deleted_at.is_null())
        .filter(id.eq(req.id))
        .filter(host.eq(uid))
        .get_result::<Room>(conn)?;

    if r.game_id != req.game_id {
        end_game(conn, uid, r.game_id);
        start_game(conn, uid, req.game_id);
    }

    let room = diesel::update(
        rooms
            .filter(deleted_at.is_null())
            .filter(id.eq(req.id))
            .filter(host.eq(uid)),
    )
    .set((
        game_id.eq(req.game_id),
        host.eq(req.host),
        private.eq(req.private),
        updated_at.eq(Utc::now().naive_utc()),
    ))
    .get_result::<Room>(conn)?;

    Ok(convert_to_sc_room_basic(&room))
}

pub fn update_room_screenshot(
    conn: &PgConnection,
    uid: i32,
    req: &ScUpdateRoomScreenshot,
) -> FieldResult<ScRoomBasic> {
    use self::rooms::dsl::*;

    let room = diesel::update(
        rooms
            .filter(deleted_at.is_null())
            .filter(id.eq(req.id))
            .filter(host.eq(uid)),
    )
    .set((
        screenshot.eq(req.screenshot.clone()),
        updated_at.eq(Utc::now().naive_utc()),
    ))
    .get_result::<Room>(conn)?;

    Ok(convert_to_sc_room_basic(&room))
}

pub fn delete_room(conn: &PgConnection, rid: i32) {
    use self::rooms::dsl::*;

    if let Ok(room) = rooms.filter(id.eq(rid)).get_result::<Room>(conn) {
        for user_id in get_room_user_ids(conn, rid) {
            end_game(conn, user_id, room.game_id);
        }
    }

    delete_playing_with_room(conn, rid);

    diesel::delete(rooms.filter(id.eq(rid)))
        .execute(conn)
        .unwrap();
}

pub fn enter_room(conn: &PgConnection, uid: i32, rid: i32) {
    use self::rooms::dsl::*;

    if let Ok(room) = rooms.filter(id.eq(rid)).get_result::<Room>(conn) {
        start_game(conn, uid, room.game_id);
    }

    delete_playing(conn, uid);
    create_playing(conn, uid, rid).ok();
    delete_invite(conn, uid, true);
}

pub fn leave_room(conn: &PgConnection, uid: i32, rid: i32) {
    use self::rooms::dsl::*;

    if let Ok(room) = rooms.filter(id.eq(rid)).get_result::<Room>(conn) {
        end_game(conn, uid, room.game_id);
    }

    delete_playing(conn, uid);
    delete_invite(conn, uid, false);
}
