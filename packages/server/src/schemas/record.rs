use chrono::{DateTime, NaiveDateTime, Utc};
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::models::{NewRecord, Record};
use crate::db::schema::records;
use crate::schemas::notify::get_online_time;
use juniper::{GraphQLInputObject, GraphQLObject};

#[derive(GraphQLInputObject)]
pub struct ScRecordReq {
    pub game_id: i32,
}

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScRecord {
    play_total: f64,
    last_play_start_at: f64,
    last_play_end_at: Option<f64>,
}

fn convert_to_sc_record(record: &Record) -> ScRecord {
    ScRecord {
        last_play_end_at: record
            .last_play_end_at
            .map(|time| time.timestamp_millis() as f64),
        last_play_start_at: record.last_play_start_at.timestamp_millis() as f64,
        play_total: record.play_total as f64,
    }
}

pub fn start_game(conn: &PgConnection, uid: i32, gid: i32) {
    use self::records::dsl::*;

    let r = records
        .filter(user_id.eq(uid))
        .filter(game_id.eq(gid))
        .get_results::<Record>(conn)
        .unwrap();

    if r.len() != 0 {
        diesel::update(records.filter(game_id.eq(gid)).filter(user_id.eq(uid)))
            .set((
                last_play_start_at.eq(Utc::now().naive_utc()),
                last_play_end_at.eq(None::<NaiveDateTime>),
            ))
            .execute(conn)
            .ok();

        return;
    }

    let new_record = NewRecord {
        user_id: uid,
        game_id: gid,
        play_total: 0,
        last_play_end_at: None,
        last_play_start_at: Utc::now().naive_utc(),
    };

    diesel::insert_into(records)
        .values(&new_record)
        .execute(conn)
        .ok();
}

pub fn end_game(conn: &PgConnection, uid: i32, gid: i32) {
    use self::records::dsl::*;

    if let Some(online_time) = get_online_time(uid) {
        let r = records
            .filter(user_id.eq(uid))
            .filter(game_id.eq(gid))
            .get_result::<Record>(conn);

        if let Ok(record) = r {
            let duration = Utc::now().timestamp_millis()
                - std::cmp::max(
                    record.last_play_start_at.timestamp_millis(),
                    online_time.timestamp_millis(),
                );

            diesel::update(records.filter(game_id.eq(gid)).filter(user_id.eq(uid)))
                .set((
                    last_play_end_at.eq(Utc::now().naive_utc()),
                    play_total.eq(record.play_total + duration),
                ))
                .execute(conn)
                .ok();
        }
    }
}

pub fn pause_game(conn: &PgConnection, uid: i32, gid: i32, online_time: DateTime<Utc>) {
    use self::records::dsl::*;

    let r = records
        .filter(user_id.eq(uid))
        .filter(game_id.eq(gid))
        .get_result::<Record>(conn);

    if let Ok(record) = r {
        let duration = Utc::now().timestamp_millis()
            - std::cmp::max(
                record.last_play_start_at.timestamp_millis(),
                online_time.timestamp_millis(),
            );

        diesel::update(records.filter(game_id.eq(gid)).filter(user_id.eq(uid)))
            .set((play_total.eq(record.play_total + duration),))
            .execute(conn)
            .ok();
    }
}

pub fn get_recent_ids(conn: &PgConnection, uid: i32) -> Vec<i32> {
    use self::records::dsl::*;

    records
        .filter(user_id.eq(uid))
        .order(last_play_start_at.desc())
        .load::<Record>(conn)
        .unwrap()
        .iter()
        .map(|record| record.game_id)
        .collect()
}

pub fn get_record(conn: &PgConnection, uid: i32, gid: i32) -> Option<ScRecord> {
    use self::records::dsl::*;

    records
        .filter(user_id.eq(uid))
        .filter(game_id.eq(gid))
        .get_result::<Record>(conn)
        .ok()
        .map(|record| convert_to_sc_record(&record))
}
