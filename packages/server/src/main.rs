extern crate openssl;
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate derive_builder;

use dotenv::dotenv;
use std::{env, io, sync::Arc, time::Duration};

use actix_cors::Cors;
use actix_web::{
    middleware,
    web::{self, Data},
    App, HttpServer,
};
use actix_web_lab::respond::Html;
use juniper::http::playground::playground_source;
use tokio::time;

use crate::{
    db::root::DB_POOL,
    error::Error,
    handles::*,
    schemas::{
        room::delete_room,
        room::get_outdated_rooms,
        root::{create_guest_schema, create_schema, leave_room_and_notify},
    },
};

mod auth;
mod db;
mod error;
mod github;
mod handles;
mod schemas;
mod voice;

#[actix_web::main]
async fn main() -> io::Result<()> {
    openssl_probe::init_ssl_cert_env_vars();

    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    let port = env::var("PORT")
        .unwrap_or_default()
        .parse::<u16>()
        .unwrap_or(8080);
    let secret = env::var("SECRET").unwrap_or("xxx".to_owned());

    let schema = Arc::new(create_schema());
    let guestschema = Arc::new(create_guest_schema());

    log::info!("playground: http://localhost:{}/playground", port);
    log::info!("guestplayground: http://localhost:{}/guestplayground", port);

    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(60 * 60));
        loop {
            interval.tick().await;
            let conn = DB_POOL.get().unwrap();
            let mut rooms = get_outdated_rooms(&conn);
            rooms.truncate(100);
            rooms.iter().for_each(|room| {
                if let Err(err) = leave_room_and_notify(room.host) {
                    if err.extensions().to_owned() == Error::username_not_playing() {
                        delete_room(&conn, room.id);
                    } else {
                        log::error!("{:?}", err);
                    }
                }
            });
            log::debug!("Clean outdated rooms: {:?}", rooms);
        }
    });

    HttpServer::new(move || {
        App::new()
            .service(
                web::resource("/subscriptions")
                    .app_data(Data::from(schema.clone()))
                    .app_data(Data::new(secret.clone()))
                    .route(web::get().to(subscriptions)),
            )
            .service(
                web::resource("/graphql")
                    .app_data(Data::from(schema.clone()))
                    .app_data(Data::new(secret.clone()))
                    .route(web::post().to(graphql)),
            )
            .service(
                web::resource("/schema")
                    .app_data(Data::from(schema.clone()))
                    .route(web::get().to(graphqlschema)),
            )
            .service(
                web::resource("/playground").route(
                    web::get().to(|| async {
                        Html(playground_source("/graphql", Some("/subscriptions")))
                    }),
                ),
            )
            .service(
                web::resource("/guestgraphql")
                    .app_data(Data::new(secret.clone()))
                    .app_data(Data::from(guestschema.clone()))
                    .route(web::post().to(guestgraphql)),
            )
            .service(
                web::resource("/guestschema")
                    .app_data(Data::from(guestschema.clone()))
                    .route(web::get().to(guestgraphqlschema)),
            )
            .service(
                web::resource("/guestplayground").route(
                    web::get().to(|| async { Html(playground_source("/guestgraphql", None)) }),
                ),
            )
            .service(
                web::resource("/webhook")
                    .app_data(Data::new(secret.clone()))
                    .route(web::post().to(webhook)),
            )
            .wrap(Cors::permissive())
            .wrap(middleware::Logger::default())
    })
    .workers(2)
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
