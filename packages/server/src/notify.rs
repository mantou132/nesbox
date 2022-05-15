use crate::schemas::message::*;
use std::collections::HashMap;
use std::sync::Mutex;
use tokio::sync::broadcast::{self, Receiver, Sender};

lazy_static! {
    static ref NOTIFY_MAP: Mutex<HashMap<i32, Sender<ScMessage>>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

pub fn send_message(msg: ScMessage) {
    let map = NOTIFY_MAP.lock().unwrap();
    if let Some(tx) = map.get(&msg.target_id) {
        tx.send(msg).unwrap();
    }
}

pub fn get_receiver(user_id: i32) -> Receiver<ScMessage> {
    let mut map = NOTIFY_MAP.lock().unwrap();
    map.entry(user_id)
        .or_insert(broadcast::channel(5).0)
        .subscribe()
}
