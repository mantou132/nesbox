use std::collections::HashMap;
use std::sync::Mutex;
use tokio::sync::broadcast::{self, Receiver, Sender};

lazy_static! {
    static ref NOTIFY_MAP: Mutex<HashMap<String, Sender<String>>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

pub fn send_msg(username: String, msg: String) {
    let map = NOTIFY_MAP.lock().unwrap();
    if let Some(tx) = map.get(&username) {
        tx.send(msg).unwrap();
    }
}

pub fn get_receiver(username: String) -> Receiver<String> {
    let mut map = NOTIFY_MAP.lock().unwrap();
    map.entry(username)
        .or_insert(broadcast::channel::<String>(10).0)
        .subscribe()
}
