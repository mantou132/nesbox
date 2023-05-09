use crate::db::root::DB_POOL;
use crate::error::Error;

use super::comment::*;
use super::favorite::*;
use super::friend::*;
use super::game::*;
use super::invite::*;
use super::lobby::*;
use super::message::*;
use super::notify::*;
use super::playing::*;
use super::record::*;
use super::room::*;
use super::user::*;
use crate::voice::*;
use chrono::Utc;
use futures::Stream;
use juniper::{graphql_subscription, EmptySubscription, FieldError, FieldResult, RootNode};
use std::pin::Pin;

pub struct QueryRoot;

#[juniper::graphql_object(Context = Context)]
impl QueryRoot {
    #[deprecated]
    fn games(_context: &Context) -> FieldResult<Vec<ScGame>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_games(&conn))
    }
    fn recent_games(context: &Context) -> FieldResult<Vec<i32>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_recent_ids(&conn, context.user_id))
    }
    fn top_games(_context: &Context) -> FieldResult<Vec<i32>> {
        // TODO: 个性化推荐
        let conn = DB_POOL.get().unwrap();
        Ok(get_top_ids(&conn))
    }
    fn favorites(context: &Context) -> FieldResult<Vec<i32>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_favorites(&conn, context.user_id))
    }
    #[deprecated]
    fn comments(_context: &Context, input: ScCommentsReq) -> FieldResult<Vec<ScComment>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_comments(&conn, input.game_id))
    }
    fn record(context: &Context, input: ScRecordReq) -> FieldResult<Option<ScRecord>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_record(&conn, context.user_id, input.game_id))
    }
    fn account(context: &Context) -> FieldResult<ScUser> {
        let conn = DB_POOL.get().unwrap();
        get_account(&conn, context.user_id)
    }
    fn messages(context: &Context, input: ScMessagesReq) -> FieldResult<Vec<ScMessage>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_messages(&conn, context.user_id, input.target_id))
    }
    fn friends(context: &Context) -> FieldResult<Vec<ScFriend>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_friends(&conn, context.user_id))
    }
    #[deprecated]
    fn rooms(_context: &Context) -> FieldResult<Vec<ScRoom>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_rooms(&conn))
    }
    fn invites(context: &Context) -> FieldResult<Vec<ScInvite>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_invites(&conn, context.user_id))
    }
}

pub struct MutationRoot;

#[juniper::graphql_object(Context = Context)]
impl MutationRoot {
    fn enter_lobby(context: &Context, input: ScEnterLobbyReq) -> FieldResult<ScLobbyInfo> {
        Ok(enter_lobby(context.user_id, input))
    }
    fn leave_lobby(context: &Context) -> FieldResult<String> {
        leave_lobby(context.user_id);
        Ok("Ok".into())
    }
    fn lobby_msg(context: &Context, input: ScNewLobbyMessage) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        let user = get_user_basic(&conn, context.user_id)?;
        notify_ids(
            get_lobby_other_ids(context.user_id),
            ScNotifyMessageBuilder::default()
                .lobby_message(ScLobbyMessage {
                    created_at: Utc::now().timestamp_millis() as f64,
                    user_id: context.user_id,
                    nickname: user.nickname,
                    username: user.username,
                    text: input.text,
                })
                .build()
                .unwrap(),
        );
        Ok("Ok".into())
    }
    fn voice_msg(context: &Context, input: ScVoiceMsgReq) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        let user_id = context.user_id;
        if let Some(room_id) = get_playing(&conn, user_id).map(|room| room.id) {
            tokio::spawn(async move {
                handle_msg(user_id, room_id, input, move |json| {
                    notify(
                        user_id,
                        ScNotifyMessageBuilder::default()
                            .voice_signal(ScVoiceSignal { json, room_id })
                            .build()
                            .unwrap(),
                    );
                })
                .await;
            });
        }
        Ok("ok".into())
    }
    fn signaling(context: &Context, input: ScNewSignal) -> FieldResult<String> {
        notify(
            input.target_id,
            ScNotifyMessageBuilder::default()
                .send_signal(ScSignal {
                    json: input.json,
                    user_id: context.user_id,
                })
                .build()
                .unwrap(),
        );
        Ok("Ok".into())
    }
    fn update_account(context: &Context, input: ScUpdateUser) -> FieldResult<ScUser> {
        let conn = DB_POOL.get().unwrap();
        update_user(&conn, context.user_id, &input)
    }
    fn update_password(context: &Context, input: ScUpdatePassword) -> FieldResult<ScUser> {
        let conn = DB_POOL.get().unwrap();
        update_password(&conn, context.user_id, &input)
    }
    fn create_game(_context: &Context, input: ScNewGame) -> FieldResult<ScGame> {
        let conn = DB_POOL.get().unwrap();
        let game = create_game(&conn, &input)?;
        notify_all(
            ScNotifyMessageBuilder::default()
                .new_game(game.clone())
                .build()
                .unwrap(),
        );
        Ok(game)
    }
    fn create_comment(context: &Context, input: ScNewComment) -> FieldResult<ScComment> {
        let conn = DB_POOL.get().unwrap();
        create_comment(&conn, context.user_id, &input)
    }
    fn create_message(context: &Context, input: ScNewMessage) -> FieldResult<ScMessage> {
        let conn = DB_POOL.get().unwrap();
        let message = create_message(&conn, context.user_id, &input)?;
        notify(
            message.target_id,
            ScNotifyMessageBuilder::default()
                .new_message(message.clone())
                .build()
                .unwrap(),
        );
        Ok(message)
    }
    fn read_message(context: &Context, input: ScReadMessage) -> FieldResult<ScFriend> {
        let conn = DB_POOL.get().unwrap();
        read_message(&conn, context.user_id, input.target_id)
    }
    fn favorite_game(context: &Context, input: ScNewFavorite) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        if input.favorite {
            create_favorite(&conn, context.user_id, input.game_id).ok();
            notify(
                context.user_id,
                ScNotifyMessageBuilder::default()
                    .favorite(input.game_id)
                    .build()
                    .unwrap(),
            );
        } else {
            delete_favorite(&conn, context.user_id, input.game_id);
            notify(
                context.user_id,
                ScNotifyMessageBuilder::default()
                    .delete_favorite(input.game_id)
                    .build()
                    .unwrap(),
            );
        }
        Ok("Ok".into())
    }
    fn apply_friend(context: &Context, input: ScNewFriend) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        if let Ok(target_user) = get_user_by_username(&conn, &input.username) {
            if context.user_id != target_user.id {
                match apply_friend(&conn, context.user_id, target_user.id) {
                    Ok(friend) => {
                        notify(
                            target_user.id,
                            ScNotifyMessageBuilder::default()
                                .apply_friend(friend.clone())
                                .build()
                                .unwrap(),
                        );
                    }
                    Err(err) => log::debug!("{:?}", err),
                }
            }
        }
        Ok("Ok".into())
    }
    fn accept_friend(context: &Context, input: ScUpdateFriend) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        if input.accept {
            if let Ok(friend) = accept_friend(&conn, context.user_id, input.target_id) {
                notify(
                    input.target_id,
                    ScNotifyMessageBuilder::default()
                        .accept_friend(friend.clone())
                        .build()
                        .unwrap(),
                );
            }
        } else {
            delete_friend(&conn, context.user_id, input.target_id);
            notify(
                input.target_id,
                ScNotifyMessageBuilder::default()
                    .delete_friend(context.user_id)
                    .build()
                    .unwrap(),
            );
        }
        Ok("Ok".into())
    }
    fn create_invite(context: &Context, input: ScNewInvite) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        let room_id = get_playing(&conn, input.target_id).map(|room| room.id);
        if Some(input.room_id) != room_id {
            match create_invite(&conn, context.user_id, &input) {
                Ok((deleted_invite, invite)) => {
                    if let Some(deleted_id) = deleted_invite {
                        notify(
                            input.target_id,
                            ScNotifyMessageBuilder::default()
                                .delete_invite(deleted_id)
                                .build()
                                .unwrap(),
                        );
                    }
                    notify(
                        invite.target_id,
                        ScNotifyMessageBuilder::default()
                            .new_invite(invite.clone())
                            .build()
                            .unwrap(),
                    );
                }
                Err(err) => log::debug!("{:?}", err),
            }
        }

        Ok("Ok".into())
    }
    fn accept_invite(context: &Context, input: ScUpdateInvite) -> FieldResult<String> {
        let conn = DB_POOL.get().unwrap();
        let invite = get_invite(&conn, context.user_id, input.invite_id)?;

        if input.accept {
            let (room_id, room_host) = get_playing(&conn, context.user_id)
                .map(|room| (room.id, room.host))
                .unwrap_or((0, 0));

            if room_id != invite.room.id {
                if room_host == context.user_id {
                    delete_room(&conn, room_id);
                    notify_all(
                        ScNotifyMessageBuilder::default()
                            .delete_room(room_id)
                            .build()
                            .unwrap(),
                    );
                }
                enter_room(&conn, context.user_id, invite.room.id);
                notify_ids(
                    get_friend_ids(&conn, context.user_id),
                    ScNotifyMessageBuilder::default()
                        .update_user(get_user_basic(&conn, context.user_id)?)
                        .build()
                        .unwrap(),
                );
            }
        } else {
            delete_invite_by_id(&conn, context.user_id, input.invite_id);
        }
        Ok("Ok".into())
    }
    fn create_room(context: &Context, input: ScNewRoom) -> FieldResult<ScRoomBasic> {
        let conn = DB_POOL.get().unwrap();
        let room = create_room(&conn, context.user_id, &input)?;
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessageBuilder::default()
                .update_user(get_user_basic(&conn, context.user_id)?)
                .build()
                .unwrap(),
        );
        Ok(room)
    }
    fn update_room(context: &Context, input: ScUpdateRoom) -> FieldResult<ScRoomBasic> {
        let conn = DB_POOL.get().unwrap();
        let room = update_room(&conn, context.user_id, &input)?;
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessageBuilder::default()
                .update_user(get_user_basic(&conn, context.user_id)?)
                .build()
                .unwrap(),
        );
        notify_ids(
            get_room_user_ids(&conn, input.id),
            ScNotifyMessageBuilder::default()
                .update_room(get_room(&conn, input.id)?)
                .build()
                .unwrap(),
        );

        Ok(room)
    }
    fn update_room_screenshot(
        context: &Context,
        input: ScUpdateRoomScreenshot,
    ) -> FieldResult<ScRoomBasic> {
        let conn = DB_POOL.get().unwrap();
        Ok(update_room_screenshot(&conn, context.user_id, &input)?)
    }
    fn enter_pub_room(context: &Context, input: ScUpdatePlaying) -> FieldResult<ScRoomBasic> {
        let conn = DB_POOL.get().unwrap();
        let room = get_room(&conn, input.room_id)?;
        if room.private {
            return Err("private room".into());
        }
        enter_room(&conn, context.user_id, input.room_id);
        notify_ids(
            get_friend_ids(&conn, context.user_id),
            ScNotifyMessageBuilder::default()
                .update_user(get_user_basic(&conn, context.user_id)?)
                .build()
                .unwrap(),
        );
        Ok(room)
    }
    fn leave_room(context: &Context) -> FieldResult<String> {
        leave_room_and_notify(context.user_id)
    }
}

pub fn leave_room_and_notify(user_id: i32) -> FieldResult<String> {
    let conn = DB_POOL.get().unwrap();
    let room = get_playing(&conn, user_id).ok_or(FieldError::new(
        format!("{} not playing", user_id),
        Error::username_not_playing(),
    ))?;
    let invites = get_invites_with(&conn, user_id);
    leave_room(&conn, user_id, room.id);
    if user_id == room.host {
        delete_room(&conn, room.id);
        notify_all(
            ScNotifyMessageBuilder::default()
                .delete_room(room.id)
                .build()
                .unwrap(),
        )
    }
    for invite in invites {
        notify(
            invite.target_id,
            ScNotifyMessageBuilder::default()
                .delete_invite(invite.id)
                .build()
                .unwrap(),
        );
    }
    notify_ids(
        get_friend_ids(&conn, user_id),
        ScNotifyMessageBuilder::default()
            .update_user(get_user_basic(&conn, user_id)?)
            .build()
            .unwrap(),
    );
    Ok("Ok".into())
}

pub struct Subscription;

type FriendSysStream = Pin<Box<dyn Stream<Item = Result<ScNotifyMessage, FieldError>> + Send>>;

#[graphql_subscription(context = Context)]
impl Subscription {
    async fn event(context: &Context) -> FriendSysStream {
        let mut rx = get_receiver(context.user_id);
        let stream = async_stream::stream! {
            loop {
                let result = rx.0.recv().await.unwrap();
                yield Ok(result)
            }
        };

        let conn = DB_POOL.get().unwrap();
        if let Ok(user) = get_user_basic(&conn, context.user_id) {
            notify_ids(
                get_friend_ids(&conn, context.user_id),
                ScNotifyMessageBuilder::default()
                    .update_user(user)
                    .build()
                    .unwrap(),
            );
        }

        Box::pin(stream)
    }
}

pub struct Context {
    pub user_id: i32,
}

impl juniper::Context for Context {}

pub type Schema = RootNode<'static, QueryRoot, MutationRoot, Subscription>;

pub fn create_schema() -> Schema {
    Schema::new(QueryRoot {}, MutationRoot {}, Subscription {})
}

pub struct GuestContext {
    pub secret: String,
}

pub struct GuestQueryRoot;

#[juniper::graphql_object(Context = GuestContext)]
impl GuestQueryRoot {
    fn hello() -> FieldResult<String> {
        Ok("guest".to_owned())
    }

    fn games(_context: &GuestContext) -> FieldResult<Vec<ScGame>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_games(&conn))
    }

    fn top_games(_context: &GuestContext) -> FieldResult<Vec<i32>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_top_ids(&conn))
    }

    fn comments(_context: &GuestContext, input: ScCommentsReq) -> FieldResult<Vec<ScComment>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_comments(&conn, input.game_id))
    }

    fn rooms(_context: &GuestContext) -> FieldResult<Vec<ScRoom>> {
        let conn = DB_POOL.get().unwrap();
        Ok(get_rooms(&conn))
    }
}

pub struct GuestMutationRoot;

impl juniper::Context for GuestContext {}

#[juniper::graphql_object(Context = GuestContext)]
impl GuestMutationRoot {
    fn register(context: &GuestContext, input: ScRegisterReq) -> FieldResult<ScLoginResp> {
        let conn = DB_POOL.get().unwrap();
        register(&conn, input, &context.secret)
    }

    fn login(context: &GuestContext, input: ScLoginReq) -> FieldResult<ScLoginResp> {
        let conn = DB_POOL.get().unwrap();
        let disable_sso = input.disable_sso.unwrap_or_default();
        let resp = login(&conn, input, &context.secret)?;
        if !disable_sso {
            notify(
                resp.user.id,
                ScNotifyMessageBuilder::default()
                    .login(true)
                    .build()
                    .unwrap(),
            );
        }
        Ok(resp)
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
