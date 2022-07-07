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
use std::{env, io, sync::Arc};

use actix_cors::Cors;
use actix_web::{
    middleware,
    web::{self, Data},
    App, HttpServer,
};
use actix_web_lab::respond::Html;
use juniper::http::playground::playground_source;

use crate::{
    handles::*,
    schemas::root::{create_guest_schema, create_schema},
};

mod auth;
mod db;
mod error;
mod github;
mod handles;
mod schemas;

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
