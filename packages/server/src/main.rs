#[macro_use]
extern crate diesel;

use dotenv::dotenv;
use std::{env, io, sync::Arc};

use actix_cors::Cors;
use actix_web::{
    get, middleware, route,
    web::{self, Data},
    App, HttpResponse, HttpServer, Responder,
};
use actix_web_lab::respond::Html;
use juniper::http::{graphiql::graphiql_source, GraphQLRequest};

mod db;
mod schemas;

use crate::{
    db::root::{get_db_pool, Pool},
    schemas::root::{create_schema, Context, Schema},
};

#[get("/graphiql")]
async fn graphql_playground() -> impl Responder {
    // TODO: subscriptions
    Html(graphiql_source("/graphql", None))
}

#[route("/graphql", method = "GET", method = "POST")]
async fn graphql(
    schema: web::Data<Schema>,
    pool: web::Data<Pool>,
    data: web::Json<GraphQLRequest>,
) -> impl Responder {
    let ctx = Context {
        dbpool: pool.get_ref().to_owned(),
    };
    let res = data.execute(&schema, &ctx).await;
    HttpResponse::Ok().json(res)
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let pool = get_db_pool();

    // TODO: download schema without jwt
    let schema = Arc::new(create_schema());
    let port = env::var("PORT")
        .unwrap_or("8080".to_owned())
        .parse::<u16>()
        .expect("port parse error");

    log::info!("GraphiQL playground: http://localhost:{}/graphiql", port);

    HttpServer::new(move || {
        App::new()
            .app_data(Data::new(pool.clone()))
            .app_data(Data::from(schema.clone()))
            .service(graphql)
            .service(graphql_playground)
            // the graphiql UI requires CORS to be enabled
            .wrap(Cors::permissive())
            .wrap(middleware::Logger::default())
    })
    .workers(2)
    .bind(("::1", port))?
    .run()
    .await
}
