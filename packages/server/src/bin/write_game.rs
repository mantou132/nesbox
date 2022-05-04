extern crate diesel;
extern crate server;

use self::diesel::prelude::*;

use self::server::*;

use self::db::models::NewGame;
use chrono::NaiveDate;
use db::schema::games;
use server::db::models::Game;

fn main() {
    let connection = establish_connection();

    let new_game = NewGame {
        name: "name",
        description: "description",
        preview: "preview",
        rom: "rom",
        deleted_at: None,
        created_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
        updated_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
    };

    diesel::insert_into(games::table)
        .values(&new_game)
        .get_result::<Game>(&connection)
        .expect("Error saving new game");
}
