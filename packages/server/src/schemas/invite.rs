use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{FieldResult, GraphQLInputObject, GraphQLObject};

use crate::db::models::{Invite, NewInvite};
use crate::db::schema::invites;

use super::room::{get_room, ScRoomBasic};

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScInvite {
    pub id: i32,
    pub room: ScRoomBasic,
    pub target_id: i32,
    user_id: i32,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScNewInvite {
    room_id: i32,
    pub target_id: i32,
}

#[derive(GraphQLInputObject)]
pub struct ScUpdateInvite {
    pub invite_id: i32,
    pub accept: bool,
}

fn convert_to_sc_invite(conn: &PgConnection, invite: &Invite) -> ScInvite {
    ScInvite {
        id: invite.id,
        room: get_room(conn, invite.room_id),
        target_id: invite.target_id,
        user_id: invite.user_id,
        created_at: invite.created_at.timestamp_millis() as f64,
        updated_at: invite.updated_at.timestamp_millis() as f64,
    }
}

pub fn get_invites(conn: &PgConnection, uid: i32) -> Vec<ScInvite> {
    use self::invites::dsl::*;

    invites
        .filter(deleted_at.is_null())
        .filter(target_id.eq(uid))
        .load::<Invite>(conn)
        .unwrap()
        .iter()
        .map(|invite| convert_to_sc_invite(conn, &invite))
        .collect()
}

pub fn get_invites_with(conn: &PgConnection, uid: i32) -> Vec<ScInvite> {
    use self::invites::dsl::*;

    invites
        .filter(deleted_at.is_null())
        .filter(user_id.eq(uid))
        .load::<Invite>(conn)
        .unwrap()
        .iter()
        .map(|invite| convert_to_sc_invite(conn, &invite))
        .collect()
}

pub fn get_invite(conn: &PgConnection, uid: i32, iid: i32) -> FieldResult<ScInvite> {
    use self::invites::dsl::*;

    let invite = invites
        .filter(deleted_at.is_null())
        .filter(target_id.eq(uid))
        .filter(id.eq(iid))
        .get_result::<Invite>(conn)?;

    Ok(convert_to_sc_invite(conn, &invite))
}

pub fn create_invite(conn: &PgConnection, uid: i32, req: &ScNewInvite) -> FieldResult<ScInvite> {
    use self::invites::dsl::*;

    diesel::delete(
        invites
            .filter(user_id.eq(uid))
            .filter(target_id.eq(req.target_id)),
    )
    .execute(conn)
    .unwrap();

    let new_invite = NewInvite {
        user_id: uid,
        room_id: req.room_id,
        target_id: req.target_id,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let invite = diesel::insert_into(invites)
        .values(&new_invite)
        .get_result::<Invite>(conn)?;

    Ok(convert_to_sc_invite(conn, &invite))
}

pub fn delete_invite_by_id(conn: &PgConnection, uid: i32, iid: i32) {
    use self::invites::dsl::*;

    diesel::delete(invites.filter(target_id.eq(uid)).filter(id.eq(iid)))
        .get_result::<Invite>(conn)
        .unwrap();
}

pub fn delete_invite(conn: &PgConnection, uid: i32, all: bool) {
    use self::invites::dsl::*;

    diesel::delete(invites.filter(user_id.eq(uid)))
        .execute(conn)
        .unwrap();

    if all {
        diesel::delete(invites.filter(target_id.eq(uid)))
            .execute(conn)
            .unwrap();
    }
}
