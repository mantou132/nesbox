use super::{
    friend::ScFriend, game::ScGame, invite::ScInvite, message::ScMessage, user::ScUserBasic,
};
use juniper::GraphQLObject;
use std::collections::HashMap;
use std::sync::Mutex;
use tokio::sync::broadcast::{self, Receiver, Sender};

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScNotifyMessage {
    new_message: Option<ScMessage>,
    new_game: Option<ScGame>,
    new_invite: Option<ScInvite>,
    apply_friend: Option<ScFriend>,
    accept_friend: Option<ScFriend>,
    delete_friend: Option<i32>,
    update_user: Option<ScUserBasic>,
}

impl ScNotifyMessage {
    fn new() -> Self {
        ScNotifyMessage {
            new_message: None,
            new_game: None,
            new_invite: None,
            apply_friend: None,
            accept_friend: None,
            delete_friend: None,
            update_user: None,
        }
    }
    pub fn new_message(data: ScMessage) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.new_message = Some(data);
        msg
    }
    pub fn new_game(data: ScGame) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.new_game = Some(data);
        msg
    }
    pub fn new_invite(data: ScInvite) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.new_invite = Some(data);
        msg
    }
    pub fn apply_friend(data: ScFriend) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.apply_friend = Some(data);
        msg
    }
    pub fn accept_friend(data: ScFriend) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.accept_friend = Some(data);
        msg
    }
    pub fn delete_friend(data: i32) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.delete_friend = Some(data);
        msg
    }
    pub fn update_user(data: ScUserBasic) -> ScNotifyMessage {
        let mut msg = ScNotifyMessage::new();
        msg.update_user = Some(data);
        msg
    }
}

lazy_static! {
    static ref NOTIFY_MAP: Mutex<HashMap<i32, Sender<ScNotifyMessage>>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

pub fn notify(user_id: i32, msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.lock().unwrap();
    if let Some(tx) = map.get(&user_id) {
        tx.send(msg).unwrap();
    }
}

pub fn notify_ids(ids: Vec<i32>, msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.lock().unwrap();
    for user_id in ids {
        let msg = msg.clone();
        if let Some(tx) = map.get(&user_id) {
            tx.send(msg).unwrap();
        }
    }
}

pub fn notify_all(msg: ScNotifyMessage) {
    let map = NOTIFY_MAP.lock().unwrap();
    for (user_id, _) in map.iter() {
        let msg = msg.clone();
        if let Some(tx) = map.get(&user_id) {
            tx.send(msg).unwrap();
        }
    }
}

pub fn get_receiver(user_id: i32) -> Receiver<ScNotifyMessage> {
    let mut map = NOTIFY_MAP.lock().unwrap();
    map.entry(user_id)
        .or_insert(broadcast::channel(5).0)
        .subscribe()
}
