use super::comment::*;
use super::favorite::*;
use super::friend::*;
use super::game::*;
use super::invite::*;
use super::message::*;
use super::notify::*;
use super::playing::*;
use super::room::*;
use super::user::*;
use crate::db::root::Pool;
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
    fn top_games(context: &Context) -> FieldResult<Vec<i32>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_top_ids(&conn))
    }
    fn favorites(context: &Context) -> FieldResult<Vec<i32>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_favorites(&conn, context.user_id))
    }
    fn comments(context: &Context, game_id: i32) -> FieldResult<Vec<ScComment>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_comments(&conn, game_id))
    }
    fn account(context: &Context) -> FieldResult<ScUser> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_account(&conn, context.user_id))
    }
    fn messages(context: &Context, target_id: i32) -> FieldResult<Vec<ScMessage>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_messages(&conn, context.user_id, target_id))
    }
    fn friends(context: &Context) -> FieldResult<Vec<ScFriend>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_friends(&conn, context.user_id))
    }
    fn rooms(context: &Context) -> FieldResult<Vec<ScRoom>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_rooms(&conn))
    }
    fn invites(context: &Context) -> FieldResult<Vec<ScInvite>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_invites(&conn, context.user_id))
    }
}

pub struct MutationRoot;

#[juniper::graphql_object(Context = Context)]
impl MutationRoot {
    fn update_account(context: &Context, update_account: ScUpdateUserReq) -> FieldResult<ScUser> {
        let conn = context.dbpool.get().unwrap();
        Ok(update_user(&conn, context.user_id, &update_account))
    }
    fn create_game(context: &Context, new_game: ScNewGame) -> FieldResult<ScGame> {
        let conn = context.dbpool.get().unwrap();
        let game = create_game(&conn, &new_game);
        notify_all(ScNotifyMessage::new_game(game.clone()));
        Ok(game)
    }
    fn create_comment(context: &Context, new_comment: ScNewComment) -> FieldResult<ScComment> {
        let conn = context.dbpool.get().unwrap();
        Ok(create_comment(&conn, context.user_id, &new_comment))
    }
    fn update_comment(context: &Context, new_comment: ScNewComment) -> FieldResult<ScComment> {
        let conn = context.dbpool.get().unwrap();
        Ok(update_comment(&conn, context.user_id, &new_comment))
    }
    fn create_message(context: &Context, new_message: ScNewMessage) -> FieldResult<ScMessage> {
        let conn = context.dbpool.get().unwrap();
        let message = create_message(&conn, context.user_id, &new_message);
        notify(
            message.target_id,
            ScNotifyMessage::new_message(message.clone()),
        );
        Ok(message)
    }
    fn favorite_game(context: &Context, game_id: i32, favorite: bool) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        if favorite {
            Ok(create_favorite(&conn, context.user_id, game_id))
        } else {
            Ok(delete_favorite(&conn, context.user_id, game_id))
        }
    }
    fn apply_friend(context: &Context, target_id: i32) -> FieldResult<ScFriend> {
        let conn = context.dbpool.get().unwrap();
        let friend = apply_friend(&conn, context.user_id, target_id);
        notify(target_id, ScNotifyMessage::apply_friend(friend.clone()));
        Ok(friend)
    }
    fn accept_friend(context: &Context, target_id: i32, accept: bool) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        if accept {
            let friend = accept_friend(&conn, context.user_id, target_id);
            notify(target_id, ScNotifyMessage::accept_friend(friend.clone()));
            Ok("Ok".into())
        } else {
            delete_friend(&conn, context.user_id, target_id);
            notify(context.user_id, ScNotifyMessage::delete_friend(target_id));
            notify(target_id, ScNotifyMessage::delete_friend(context.user_id));
            Ok("Ok".into())
        }
    }
    fn create_invite(context: &Context, req: ScNewInvite) -> FieldResult<ScInvite> {
        let conn = context.dbpool.get().unwrap();
        let invite = create_invite(&conn, context.user_id, &req);
        notify(req.target_id, ScNotifyMessage::new_invite(invite.clone()));
        Ok(invite)
    }
    fn accept_invite(context: &Context, invite_id: i32, accept: bool) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        if accept {
            let invite = get_invite(&conn, context.user_id, invite_id);
            enter_room(&conn, context.user_id, invite.room.id);
            notify_ids(
                get_friend_ids(&conn, context.user_id),
                ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
            );
            Ok("Ok".into())
        } else {
            delete_invite_by_id(&conn, context.user_id, invite_id);
            Ok("Ok".into())
        }
    }
    fn create_room(context: &Context, new_room: ScNewRoom) -> FieldResult<ScRoom> {
        let conn = context.dbpool.get().unwrap();
        let room = create_room(&conn, context.user_id, &new_room);
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        Ok(room)
    }
    fn enter_pub_room(context: &Context, room_id: i32) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        let room = get_room(&conn, room_id);
        if room.private {
            return Err("private room".into());
        }
        enter_room(&conn, context.user_id, room_id);
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        Ok("Ok".into())
    }
    fn leave_room(context: &Context, room_id: i32) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        let invites = get_invites_with(&conn, context.user_id);
        leave_room(&conn, context.user_id, room_id);
        for invite in invites {
            notify(invite.target_id, ScNotifyMessage::delete_invite(invite.id));
        }
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        if get_room_user_ids(&conn, room_id).len() == 0 {
            delete_room(&conn, room_id);
            notify_all(ScNotifyMessage::delete_room(room_id))
        }
        Ok("Ok".into())
    }
}

pub struct Subscription;

type FriendSysStream = Pin<Box<dyn Stream<Item = Result<ScNotifyMessage, FieldError>> + Send>>;

#[graphql_subscription(context = Context)]
impl Subscription {
    async fn event(context: &Context) -> FriendSysStream {
        let mut rx = get_receiver(context.user_id);
        let stream = async_stream::stream! {
            loop {
                let result = rx.recv().await.unwrap();
                yield Ok(result)
            }
        };

        let conn = context.dbpool.get().unwrap();
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );

        Box::pin(stream)
    }
}

pub struct Context {
    pub dbpool: Pool,
    pub user_id: i32,
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
