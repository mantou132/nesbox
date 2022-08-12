use actix_web::{error, web, Error, HttpRequest, HttpResponse, Responder};
use juniper::{
    http::{GraphQLRequest, GraphQLResponse},
    introspect, DefaultScalarValue, InputValue, IntrospectionFormat, Variables,
};
use juniper_actix::subscriptions::subscriptions_handler;
use juniper_graphql_ws::ConnectionConfig;
use std::time::Duration;

use crate::{
    auth::{extract_token_from_req, extract_token_from_str, UserToken},
    db::root::DB_POOL,
    github::{get_sc_new_game, validate, GithubPayload},
    schemas::root::{Context, GuestContext, GuestSchema, Schema},
    schemas::{
        game::{create_game, get_game_from_name, update_game},
        notify::{notify_all, ScNotifyMessageBuilder},
    },
};

pub async fn subscriptions(
    req: HttpRequest,
    schema: web::Data<Schema>,
    secret: web::Data<String>,
    stream: web::Payload,
) -> Result<HttpResponse, Error> {
    let schema = schema.into_inner();
    subscriptions_handler(req, stream, schema, |params: Variables| async move {
        let authorization = params
            .get("authorization")
            .unwrap_or(params.get("Authorization").unwrap_or(&InputValue::Null));
        let user = match authorization {
            InputValue::Scalar(DefaultScalarValue::String(auth_string)) => {
                UserToken::parse(&secret, extract_token_from_str(&auth_string))
            }
            _ => None,
        };
        let user_id = match user {
            Some(id) => id,
            None => return Err(error::ErrorUnauthorized("Unauthorized")),
        };
        let ctx = Context { user_id };
        let config = ConnectionConfig::new(ctx).with_keep_alive_interval(Duration::from_secs(15));
        Ok(config) as Result<ConnectionConfig<Context>, Error>
    })
    .await
}

pub async fn graphql(
    req: HttpRequest,
    schema: web::Data<Schema>,
    secret: web::Data<String>,
    data: web::Json<GraphQLRequest>,
) -> impl Responder {
    let user_id = match UserToken::parse(&secret, &extract_token_from_req(&req)) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };
    let ctx = Context { user_id };
    let res = data.execute(&schema, &ctx).await;
    if res.is_ok() {
        HttpResponse::Ok().json(res)
    } else {
        HttpResponse::BadRequest().json(res)
    }
}

pub async fn graphqlschema(schema: web::Data<Schema>) -> impl Responder {
    let ctx = Context { user_id: 0 };
    let result = introspect(&schema, &ctx, IntrospectionFormat::default());
    HttpResponse::Ok().json(GraphQLResponse::from_result(result))
}

pub async fn guestgraphql(
    schema: web::Data<GuestSchema>,
    secret: web::Data<String>,
    data: web::Json<GraphQLRequest>,
) -> impl Responder {
    let ctx = GuestContext {
        secret: secret.to_string(),
    };
    let res = data.execute(&schema, &ctx).await;
    if res.is_ok() {
        HttpResponse::Ok().json(res)
    } else {
        HttpResponse::BadRequest().json(res)
    }
}

pub async fn guestgraphqlschema(schema: web::Data<GuestSchema>) -> impl Responder {
    let ctx = GuestContext {
        secret: String::new(),
    };
    let result = introspect(&schema, &ctx, IntrospectionFormat::default());
    HttpResponse::Ok().json(GraphQLResponse::from_result(result))
}

pub async fn webhook(
    req: HttpRequest,
    body: web::Bytes,
    secret: web::Data<String>,
) -> impl Responder {
    let payload: GithubPayload = serde_json::from_slice(&body).unwrap();

    log::debug!("Webhook payload: {:?}", payload);

    if !validate(&req, &secret, &body) || !payload.is_owner() {
        return HttpResponse::Unauthorized().finish();
    }

    let conn = DB_POOL.get().unwrap();

    match payload.action.as_str() {
        "closed" => {
            let sc_game = get_sc_new_game(&payload);
            if sc_game.rom.is_empty() {
                log::debug!("Not rom");
            } else {
                match get_game_from_name(&conn, &sc_game.name) {
                    Some(game) => {
                        update_game(&conn, game.id, &sc_game).ok();
                    }
                    None => {
                        if let Ok(game) = create_game(&conn, &sc_game) {
                            notify_all(
                                ScNotifyMessageBuilder::default()
                                    .new_game(game)
                                    .build()
                                    .unwrap(),
                            );
                        }
                    }
                };
            }
        }
        _ => {}
    }
    HttpResponse::Ok().json(payload)
}
