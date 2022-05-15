use super::comment::*;
use super::game::*;
use super::message::*;
use super::user::*;
use crate::db::root::Pool;
use crate::notify::{get_receiver, send_message};
use futures::Stream;
use juniper::{graphql_subscription, EmptySubscription, FieldError, FieldResult, RootNode};
use std::pin::Pin;

pub struct QueryRoot;

#[juniper::graphql_object(Context = Context)]
impl QueryRoot {
    fn games(context: &Context) -> FieldResult<Vec<ScGame>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_games(&conn))
    }
    fn comments(context: &Context, game_id: i32) -> FieldResult<Vec<ScComment>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_comments(&conn, game_id))
    }
    fn user(context: &Context) -> FieldResult<ScUser> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_user(&conn, &context.username))
    }
    fn messages(context: &Context, target_id: i32) -> FieldResult<Vec<ScMessage>> {
        let conn = context.dbpool.get().unwrap();
        let user = get_user(&conn, &context.username);
        Ok(get_messages(&conn, user.id, target_id))
    }
}

pub struct MutationRoot;

#[juniper::graphql_object(Context = Context)]
impl MutationRoot {
    fn create_game(context: &Context, new_game: ScNewGame) -> FieldResult<ScGame> {
        let conn = context.dbpool.get().unwrap();
        Ok(create_game(&conn, new_game))
    }
    fn create_comment(context: &Context, new_comment: ScNewComment) -> FieldResult<ScComment> {
        let conn = context.dbpool.get().unwrap();
        Ok(create_comment(&conn, new_comment))
    }
    fn create_message(context: &Context, new_message: ScNewMessage) -> FieldResult<ScMessage> {
        let conn = context.dbpool.get().unwrap();
        let user = get_user(&conn, &context.username);
        let message = create_message(&conn, user.id, new_message);
        send_message(message.clone());
        Ok(message)
    }
}

pub struct Subscription;

type MessageStream = Pin<Box<dyn Stream<Item = Result<ScMessage, FieldError>> + Send>>;

#[graphql_subscription(context = Context)]
impl Subscription {
    async fn message(context: &Context) -> MessageStream {
        let conn = context.dbpool.get().unwrap();
        let user = get_user(&conn, &context.username);
        let mut rx = get_receiver(user.id);
        let stream = async_stream::stream! {
            loop {
                let result = rx.recv().await.unwrap();
                yield Ok(result)
            }
        };
        Box::pin(stream)
    }
}

pub struct Context {
    pub dbpool: Pool,
    pub username: String,
}

impl juniper::Context for Context {}

pub type Schema = RootNode<'static, QueryRoot, MutationRoot, Subscription>;

pub fn create_schema() -> Schema {
    Schema::new(QueryRoot {}, MutationRoot {}, Subscription {})
}

pub struct GuestContext {
    pub dbpool: Pool,
    pub secret: String,
}

pub struct GuestQueryRoot;

#[juniper::graphql_object(Context = GuestContext)]
impl GuestQueryRoot {
    fn hello() -> FieldResult<String> {
        Ok("guest".to_owned())
    }
}

pub struct GuestMutationRoot;

impl juniper::Context for GuestContext {}

#[juniper::graphql_object(Context = GuestContext)]
impl GuestMutationRoot {
    fn register(context: &GuestContext, new_user: ScLoginReq) -> FieldResult<ScLoginResp> {
        let conn = context.dbpool.get().unwrap();
        Ok(register(&conn, new_user, &context.secret))
    }

    fn login(context: &GuestContext, user: ScLoginReq) -> FieldResult<ScLoginResp> {
        let conn = context.dbpool.get().unwrap();
        Ok(login(&conn, user, &context.secret))
    }
}

pub type GuestSchema =
    RootNode<'static, GuestQueryRoot, GuestMutationRoot, EmptySubscription<GuestContext>>;

pub fn create_guest_schema() -> GuestSchema {
    GuestSchema::new(
        GuestQueryRoot {},
        GuestMutationRoot {},
        EmptySubscription::new(),
    )
}
