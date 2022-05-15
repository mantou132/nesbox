use chrono::Utc;
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::models::{Favorite, NewFavorite};
use crate::db::schema::favorites;

pub fn get_favorites(conn: &PgConnection, uid: i32) -> Vec<i32> {
    use self::favorites::dsl::*;

    favorites
        .filter(user_id.eq(uid))
        .load::<Favorite>(conn)
        .expect("Error loading favorite")
        .iter()
        .map(|favorite| favorite.game_id)
        .collect()
}

pub fn create_favorite(conn: &PgConnection, uid: i32, gid: i32) -> String {
    let new_favorite = NewFavorite {
        user_id: uid,
        game_id: gid,
        created_at: Utc::now().naive_utc(),
    };

    diesel::insert_into(favorites::table)
        .values(&new_favorite)
        .execute(conn)
        .expect("Error saving new game");

    "Ok".into()
}

pub fn delete_favorite(conn: &PgConnection, uid: i32, gid: i32) -> String {
    use self::favorites::dsl::*;

    diesel::delete(favorites.filter(user_id.eq(uid)).filter(game_id.eq(gid)))
        .execute(conn)
        .expect("Error delete favorite");

    "Ok".into()
}
