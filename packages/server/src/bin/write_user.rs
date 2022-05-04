extern crate diesel;
extern crate server;

use self::diesel::prelude::*;

use self::server::*;

use self::db::models::NewUser;
use chrono::NaiveDate;
use db::schema::users;
use server::db::models::User;

fn main() {
    let connection = establish_connection();

    let new_user = NewUser {
        nickname: "nickname",
        password: "password",
        username: "username",
        status: "ONLINE",
        settings: None,
        deleted_at: None,
        created_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
        updated_at: NaiveDate::from_ymd(2016, 7, 8).and_hms(9, 10, 11),
    };

    diesel::insert_into(users::table)
        .values(&new_user)
        .get_result::<User>(&connection)
        .expect("Error saving new user");
}
