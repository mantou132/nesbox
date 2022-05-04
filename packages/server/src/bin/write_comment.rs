extern crate diesel;
extern crate server;

use self::diesel::prelude::*;

use self::server::*;

use self::db::models::{Comment, NewComment};
use chrono::NaiveDate;
use db::schema::comments;

fn main() {
    let connection = establish_connection();

    let new_comment = NewComment {
        body: "body",
        like: true,
        game_id: 1,
        user_id: 1,
        deleted_at: None,
        created_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
        updated_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
    };

    diesel::insert_into(comments::table)
        .values(&new_comment)
        .get_result::<Comment>(&connection)
        .expect("Error saving new comment");
}
