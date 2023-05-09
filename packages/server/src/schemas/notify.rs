use crate::{db::root::DB_POOL, schemas::lobby::leave_lobby};
use chrono::{DateTime, Utc};

use super::{
    friend::get_friend_ids, friend::ScFriend, game::ScGame, invite::ScInvite,
    lobby::ScLobbyMessage, message::ScMessage, record::pause_game, room::ScRoomBasic,
    user::get_user_basic, user::ScUserBasic,
};
use juniper::{GraphQLInputObject, GraphQLObject};
use std::collections::HashMap;
use std::sync::RwLock;
use tokio::sync::broadcast::{self, Receiver, Sender};

#[derive(GraphQLObject, Debug, Clone, Default, Builder)]
#[builder(setter(strip_option), default)]
pub struct ScNotifyMessage {
    new_message: Option<ScMessage>,
    lobby_message: Option<ScLobbyMessage>,
    new_game: Option<ScGame>,
    update_room: Option<ScRoomBasic>,
    delete_room: Option<i32>,
    new_invite: Option<ScInvite>,
    delete_invite: Option<i32>,
    apply_friend: Option<ScFriend>,
    accept_friend: Option<ScFriend>,
    delete_friend: Option<i32>,
    favorite: Option<i32>,
    delete_favorite: Option<i32>,
    update_user: Option<ScUserBasic>,
    send_signal: Option<ScSignal>,
    login: Option<bool>,
    voice_signal: Option<ScVoiceSignal>,
}

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScVoiceSignal {
    pub room_id: i32,
    pub json: String,
}

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScSignal {
    pub user_id: i32,
    pub json: String,
}
#[derive(GraphQLInputObject)]
pub struct ScNewSignal {
    pub target_id: i32,
    pub json: String,
}

lazy_static! {
    static ref NOTIFY_MAP: RwLock<HashMap<i32, (Sender<ScNotifyMessage>, DateTime<Utc>)>> = {
        let m = HashMap::new();
        RwLock::new(m)
    };
}

pub fn notify(user_id: i32, msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.read().unwrap();
    map.get(&user_id).and_then(|sender| sender.0.send(msg).ok());
}

pub fn notify_ids(ids: Vec<i32>, msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.read().unwrap();
    for user_id in ids {
        map.get(&user_id)
            .and_then(|sender| sender.0.send(msg.clone()).ok());
    }
}

pub fn notify_all(msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.read().unwrap();
    for (user_id, _) in map.iter() {
        map.get(&user_id)
            .and_then(|sender| sender.0.send(msg.clone()).ok());
    }
}

pub fn get_online_time(user_id: i32) -> Option<DateTime<Utc>> {
    let map = NOTIFY_MAP.read().unwrap();
    map.get(&user_id).map(|sender| sender.1)
}

pub fn get_online_count() -> i32 {
    NOTIFY_MAP.read().unwrap().len().try_into().unwrap()
}

pub fn has_user(user_id: i32) -> bool {
    let map = NOTIFY_MAP.read().unwrap();
    map.contains_key(&user_id)
}

pub struct NoyifyReceiver(pub Receiver<ScNotifyMessage>, pub i32);

pub fn get_receiver(user_id: i32) -> NoyifyReceiver {
    NoyifyReceiver(
        NOTIFY_MAP
            .write()
            .unwrap()
            .entry(user_id)
            .or_insert_with(|| {
                log::debug!("{} is online", user_id);
                (broadcast::channel(5).0, Utc::now())
            })
            .0
            .subscribe(),
        user_id,
    )
}

impl Drop for NoyifyReceiver {
    fn drop(&mut self) {
        let user_id = self.1;

        let online_time = NOTIFY_MAP.read().unwrap().get(&self.1).and_then(|sender| {
            if sender.0.receiver_count() <= 1 {
                Some(sender.1)
            } else {
                None
            }
        });

        if let Some(time) = online_time {
            log::debug!("{} is offline", user_id);
            // Temporary value release write lock
            NOTIFY_MAP.write().unwrap().remove(&user_id);

            leave_lobby(user_id);

            let conn = DB_POOL.get().unwrap();
            if let Ok(user) = get_user_basic(&conn, user_id) {
                notify_ids(
                    get_friend_ids(&conn, user_id),
                    ScNotifyMessageBuilder::default()
                        .update_user(user.clone())
                        .build()
                        .unwrap(),
                );

                if let Some(playing) = user.playing {
                    pause_game(&conn, user_id, playing.game_id, time);
                }
            }
        }
    }
}
