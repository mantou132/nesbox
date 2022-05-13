use actix_web::{web, HttpRequest, HttpResponse, Responder};
use juniper::{
    http::{GraphQLRequest, GraphQLResponse},
    introspect, IntrospectionFormat,
};

use crate::{
    auth::{extract_token, UserToken},
    db::root::Pool,
    schemas::root::{Context, GuestContext, GuestSchema, Schema},
};

pub async fn graphql(
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

pub async fn graphqlschema(schema: web::Data<Schema>, pool: web::Data<Pool>) -> impl Responder {
    let ctx = Context {
        username: "".to_string(),
        dbpool: pool.get_ref().to_owned(),
    };
    let result = introspect(&schema, &ctx, IntrospectionFormat::default());
    HttpResponse::Ok().json(GraphQLResponse::from_result(result))
}

pub async fn guestgraphql(
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

pub async fn guestgraphqlschema(
    schema: web::Data<GuestSchema>,
    pool: web::Data<Pool>,
) -> impl Responder {
    let ctx = GuestContext {
        secret: "".to_string(),
        dbpool: pool.get_ref().to_owned(),
    };
    let result = introspect(&schema, &ctx, IntrospectionFormat::default());
    HttpResponse::Ok().json(GraphQLResponse::from_result(result))
}
