#[macro_use]
extern crate diesel;
#[macro_use]
extern crate serde_derive;

use dotenv::dotenv;
use std::{env, io, sync::Arc};

use actix_cors::Cors;
use actix_web::{
    middleware,
    web::{self, Data},
    App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use actix_web_lab::respond::Html;
use juniper::http::{playground::playground_source, GraphQLRequest};

mod auth;
mod db;
mod schemas;

use crate::{
    auth::{extract_token, UserToken},
    db::root::{get_db_pool, Pool},
    schemas::root::{
        create_guest_schema, create_schema, Context, GuestContext, GuestSchema, Schema,
    },
};

async fn graphql(
    req: HttpRequest,
    schema: web::Data<Schema>,
    pool: web::Data<Pool>,
    secret: web::Data<String>,
    data: web::Json<GraphQLRequest>,
) -> impl Responder {
    let username = match UserToken::parse(secret.get_ref().as_bytes(), extract_token(&req)) {
        Some(username) => username,
        None => return HttpResponse::Unauthorized().finish(),
    };
    let ctx = Context {
        username,
        dbpool: pool.get_ref().to_owned(),
    };
    let res = data.execute(&schema, &ctx).await;
    HttpResponse::Ok().json(res)
}

async fn guestgraphql(
    schema: web::Data<GuestSchema>,
    pool: web::Data<Pool>,
    secret: web::Data<String>,
    data: web::Json<GraphQLRequest>,
) -> impl Responder {
    let ctx = GuestContext {
        secret: secret.to_string(),
        dbpool: pool.get_ref().to_owned(),
    };
    let res = data.execute(&schema, &ctx).await;
    HttpResponse::Ok().json(res)
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    let port = env::var("PORT")
        .unwrap_or("8080".to_owned())
        .parse::<u16>()
        .unwrap();
    let secret = env::var("SECRET").unwrap_or("xxx".to_owned());

    let pool = get_db_pool();
    // TODO: download schema without jwt
    let schema = Arc::new(create_schema());
    let guestschema = Arc::new(create_guest_schema());

    log::info!("GraphQL playground: http://localhost:{}/playground", port);

    HttpServer::new(move || {
        App::new()
            .service(
                web::resource("/graphql")
                    .app_data(Data::new(pool.clone()))
                    .app_data(Data::from(schema.clone()))
                    .app_data(Data::new(secret.clone()))
                    .route(web::post().to(graphql)),
            )
            .service(
                web::resource("/playground")
                    .route(web::get().to(|| async { Html(playground_source("/graphql", None)) })),
            )
            .service(
                web::resource("/guestgraphql")
                    .app_data(Data::new(pool.clone()))
                    .app_data(Data::new(secret.clone()))
                    .app_data(Data::from(guestschema.clone()))
                    .route(web::post().to(guestgraphql)),
            )
            .service(
                web::resource("/guestplayground").route(
                    web::get().to(|| async { Html(playground_source("/guestgraphql", None)) }),
                ),
            )
            .wrap(Cors::permissive())
            .wrap(middleware::Logger::default())
    })
    .workers(2)
    .bind(("::1", port))?
    .run()
    .await
}
