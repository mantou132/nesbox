use juniper::{EmptySubscription, FieldResult, RootNode};

use super::comment::*;
use super::game::*;
use crate::db::root::Pool;

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
}

pub struct Context {
    pub dbpool: Pool,
    pub username: String,
}

impl juniper::Context for Context {}

pub type Schema = RootNode<'static, QueryRoot, MutationRoot, EmptySubscription<Context>>;

pub fn create_schema() -> Schema {
    Schema::new(QueryRoot {}, MutationRoot {}, EmptySubscription::new())
}
