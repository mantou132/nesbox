use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use juniper::{GraphQLInputObject, GraphQLObject};

use crate::db::models::{Invite, NewInvite};
use crate::db::schema::invites;

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScInvite {
    id: i32,
    room_id: i32,
    pub target_id: i32,
    created_at: f64,
    updated_at: f64,
}

#[derive(GraphQLInputObject)]
pub struct ScNewInvite {
    room_id: i32,
    target_id: i32,
}

pub fn get_invites(conn: &PgConnection, uid: i32) -> Vec<ScInvite> {
    use self::invites::dsl::*;

    invites
        .filter(deleted_at.is_null())
        .filter(target_id.eq(uid))
        .load::<Invite>(conn)
        .expect("Error loading invite")
        .iter()
        .map(|invite| ScInvite {
            id: invite.id,
            room_id: invite.room_id,
            target_id: invite.target_id,
            created_at: invite.created_at.timestamp_millis() as f64,
            updated_at: invite.updated_at.timestamp_millis() as f64,
        })
        .collect()
}

pub fn create_invite(conn: &PgConnection, uid: i32, req: ScNewInvite) -> ScInvite {
    let new_invite = NewInvite {
        user_id: uid,
        room_id: req.room_id,
        target_id: req.target_id,
        deleted_at: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
    };

    let invite = diesel::insert_into(invites::table)
        .values(&new_invite)
        .get_result::<Invite>(conn)
        .expect("Error saving new invite");

    ScInvite {
        id: invite.id,
        room_id: invite.room_id,
        target_id: invite.target_id,
        created_at: invite.created_at.timestamp_millis() as f64,
        updated_at: invite.updated_at.timestamp_millis() as f64,
    }
}

pub fn delete_invite(conn: &PgConnection, uid: i32) -> String {
    use self::invites::dsl::*;

    diesel::delete(invites.filter(user_id.eq(uid)))
        .execute(conn)
        .expect("Error delete invite");

    "Ok".into()
}
