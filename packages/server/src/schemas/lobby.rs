use juniper::{GraphQLInputObject, GraphQLObject};
use std::cmp::max;
use std::collections::{HashMap, HashSet};
use std::sync::Mutex;

use super::notify::get_online_count;

#[derive(GraphQLInputObject)]
pub struct ScEnterLobbyReq {
    pub area: String,
}

#[derive(GraphQLInputObject)]
pub struct ScNewLobbyMessage {
    pub text: String,
}

#[derive(GraphQLObject, Debug, Clone)]
pub struct ScLobbyMessage {
    pub created_at: f64,
    pub user_id: i32,
    pub username: String,
    pub nickname: String,
    pub text: String,
}

#[derive(GraphQLObject)]
pub struct ScLobbyInfo {
    lobby_user_count: i32,
    online_user_count: i32,
}

lazy_static! {
    static ref LOBBY: Mutex<HashMap<String, HashSet<i32>>> = {
        let map = HashMap::new();
        Mutex::new(map)
    };
}

pub fn enter_lobby(uid: i32, req: ScEnterLobbyReq) -> ScLobbyInfo {
    leave_lobby(uid);

    let mut map = LOBBY.lock().unwrap();
    let area = map.entry(req.area).or_insert(HashSet::new());
    area.insert(uid);

    let lobby_user_count = area.len().try_into().unwrap();
    ScLobbyInfo {
        lobby_user_count,
        online_user_count: max(get_online_count(), lobby_user_count),
    }
}

pub fn leave_lobby(uid: i32) {
    LOBBY.lock().unwrap().values_mut().for_each(|area| {
        area.remove(&uid);
    });
}

pub fn get_lobby_other_ids(uid: i32) -> Vec<i32> {
    let mut ids = Vec::new();
    LOBBY.lock().unwrap().values().for_each(|area| {
        if area.contains(&uid) {
            area.iter().for_each(|id| {
                if *id != uid {
                    ids.push(*id);
                }
            });
        }
    });
    ids
}
