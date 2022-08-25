use crate::db::root::DB_POOL;

use super::{
    friend::get_friend_ids, friend::ScFriend, game::ScGame, invite::ScInvite, message::ScMessage,
    room::ScRoomBasic, user::get_user_basic, user::ScUserBasic,
};
use juniper::{GraphQLInputObject, GraphQLObject};
use std::collections::HashMap;
use std::sync::RwLock;
use tokio::sync::broadcast::{self, Receiver, Sender};

#[derive(GraphQLObject, Debug, Clone, Default, Builder)]
#[builder(setter(strip_option), default)]
pub struct ScNotifyMessage {
    new_message: Option<ScMessage>,
    new_game: Option<ScGame>,
    update_room: Option<ScRoomBasic>,
    delete_room: Option<i32>,
    new_invite: Option<ScInvite>,
    delete_invite: Option<i32>,
    apply_friend: Option<ScFriend>,
    accept_friend: Option<ScFriend>,
    delete_friend: Option<i32>,
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
    static ref NOTIFY_MAP: RwLock<HashMap<i32, Sender<ScNotifyMessage>>> = {
        let m = HashMap::new();
        RwLock::new(m)
    };
}

pub fn notify(user_id: i32, msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.read().unwrap();
    map.get(&user_id).and_then(|tx| tx.send(msg).ok());
}

pub fn notify_ids(ids: Vec<i32>, msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.read().unwrap();
    for user_id in ids {
        map.get(&user_id).and_then(|tx| tx.send(msg.clone()).ok());
    }
}

pub fn notify_all(msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.read().unwrap();
    for (user_id, _) in map.iter() {
        map.get(&user_id).and_then(|tx| tx.send(msg.clone()).ok());
    }
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
                broadcast::channel(5).0
            })
            .subscribe(),
        user_id,
    )
}

impl Drop for NoyifyReceiver {
    fn drop(&mut self) {
        let user_id = NOTIFY_MAP.read().unwrap().get(&self.1).and_then(|tx| {
            if tx.receiver_count() <= 1 {
                Some(self.1)
            } else {
                None
            }
        });

        if let Some(user_id) = user_id {
            log::debug!("{} is offline", user_id);
            // Temporary value release write lock
            NOTIFY_MAP.write().unwrap().remove(&user_id);

            let conn = DB_POOL.get().unwrap();
            if let Ok(user) = get_user_basic(&conn, user_id) {
                notify_ids(
                    get_friend_ids(&conn, user_id),
                    ScNotifyMessageBuilder::default()
                        .update_user(user)
                        .build()
                        .unwrap(),
                );
            }
        }
    }
}
