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
    fn comments(context: &Context, input: ScCommentsReq) -> FieldResult<Vec<ScComment>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_comments(&conn, input.game_id))
    }
    fn account(context: &Context) -> FieldResult<ScUser> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_account(&conn, context.user_id))
    }
    fn messages(context: &Context, input: ScMessagesReq) -> FieldResult<Vec<ScMessage>> {
        let conn = context.dbpool.get().unwrap();
        Ok(get_messages(&conn, context.user_id, input.target_id))
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
    fn signaling(context: &Context, input: ScNewSignal) -> FieldResult<String> {
        notify(
            input.target_id,
            ScNotifyMessage::send_signal(ScSignal {
                json: input.json,
                user_id: context.user_id,
            }),
        );
        Ok("Ok".into())
    }
    fn update_account(context: &Context, input: ScUpdateUser) -> FieldResult<ScUser> {
        let conn = context.dbpool.get().unwrap();
        Ok(update_user(&conn, context.user_id, &input))
    }
    fn create_game(context: &Context, input: ScNewGame) -> FieldResult<ScGame> {
        let conn = context.dbpool.get().unwrap();
        let game = create_game(&conn, &input);
        notify_all(ScNotifyMessage::new_game(game.clone()));
        Ok(game)
    }
    fn create_comment(context: &Context, input: ScNewComment) -> FieldResult<ScComment> {
        let conn = context.dbpool.get().unwrap();
        Ok(create_comment(&conn, context.user_id, &input))
    }
    fn create_message(context: &Context, input: ScNewMessage) -> FieldResult<ScMessage> {
        let conn = context.dbpool.get().unwrap();
        let message = create_message(&conn, context.user_id, &input);
        notify(
            message.target_id,
            ScNotifyMessage::new_message(message.clone()),
        );
        Ok(message)
    }
    fn favorite_game(context: &Context, input: ScNewFavorite) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        if input.favorite {
            Ok(create_favorite(&conn, context.user_id, input.game_id))
        } else {
            Ok(delete_favorite(&conn, context.user_id, input.game_id))
        }
    }
    fn apply_friend(context: &Context, input: ScNewFriend) -> FieldResult<ScFriend> {
        let conn = context.dbpool.get().unwrap();
        let friend = apply_friend(&conn, context.user_id, input.target_id);
        notify(
            input.target_id,
            ScNotifyMessage::apply_friend(friend.clone()),
        );
        Ok(friend)
    }
    fn accept_friend(context: &Context, input: ScUpdateFriend) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        if input.accept {
            let friend = accept_friend(&conn, context.user_id, input.target_id);
            notify(
                input.target_id,
                ScNotifyMessage::accept_friend(friend.clone()),
            );
            Ok("Ok".into())
        } else {
            delete_friend(&conn, context.user_id, input.target_id);
            notify(
                context.user_id,
                ScNotifyMessage::delete_friend(input.target_id),
            );
            notify(
                input.target_id,
                ScNotifyMessage::delete_friend(context.user_id),
            );
            Ok("Ok".into())
        }
    }
    fn create_invite(context: &Context, input: ScNewInvite) -> FieldResult<ScInvite> {
        let conn = context.dbpool.get().unwrap();
        let invite = create_invite(&conn, context.user_id, &input);
        notify(input.target_id, ScNotifyMessage::new_invite(invite.clone()));
        Ok(invite)
    }
    fn accept_invite(context: &Context, input: ScUpdateInvite) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        if input.accept {
            let invite = get_invite(&conn, context.user_id, input.invite_id);
            enter_room(&conn, context.user_id, invite.room.id);
            notify_ids(
                get_friend_ids(&conn, context.user_id),
                ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
            );
            Ok("Ok".into())
        } else {
            delete_invite_by_id(&conn, context.user_id, input.invite_id);
            Ok("Ok".into())
        }
    }
    fn create_room(context: &Context, input: ScNewRoom) -> FieldResult<ScRoomBasic> {
        let conn = context.dbpool.get().unwrap();
        let room = create_room(&conn, context.user_id, &input);
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        Ok(room)
    }
    fn update_room(context: &Context, input: ScUpdateRoom) -> FieldResult<ScRoomBasic> {
        let conn = context.dbpool.get().unwrap();
        let room = update_room(&conn, context.user_id, &input);
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        notify_ids(
            get_room_user_ids(&conn, input.id),
            ScNotifyMessage::update_room(get_room(&conn, input.id)),
        );

        Ok(room)
    }
    fn enter_pub_room(context: &Context, input: ScUpdatePlaying) -> FieldResult<ScRoomBasic> {
        let conn = context.dbpool.get().unwrap();
        let room = get_room(&conn, input.room_id);
        if room.private {
            return Err("private room".into());
        }
        enter_room(&conn, context.user_id, input.room_id);
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        Ok(room)
    }
    fn leave_room(context: &Context) -> FieldResult<String> {
        let conn = context.dbpool.get().unwrap();
        let room = get_playing(&conn, context.user_id).unwrap();
        if context.user_id == room.host {
            delete_playing_with_room(&conn, room.id);
        }
        let invites = get_invites_with(&conn, context.user_id);
        leave_room(&conn, context.user_id, room.id);
        for invite in invites {
            notify(invite.target_id, ScNotifyMessage::delete_invite(invite.id));
        }
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessage::update_user(get_user_basic(&conn, context.user_id)),
        );
        if get_room_user_ids(&conn, room.id).len() == 0 {
            delete_room(&conn, room.id);
            notify_all(ScNotifyMessage::delete_room(room.id))
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
    fn register(context: &GuestContext, input: ScLoginReq) -> FieldResult<ScLoginResp> {
        let conn = context.dbpool.get().unwrap();
        Ok(register(&conn, input, &context.secret))
    }

    fn login(context: &GuestContext, input: ScLoginReq) -> FieldResult<ScLoginResp> {
        let conn = context.dbpool.get().unwrap();
        Ok(login(&conn, input, &context.secret))
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
