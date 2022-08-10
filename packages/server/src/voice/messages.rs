use actix::prelude::{Message, Recipient};
use actix_web::web::Bytes;

#[derive(Message, Clone)]
#[rtype(result = "()")]
pub enum WsMessage {
    Text(String),
    Binary(Bytes),
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub addr: Recipient<WsMessage>,
    pub lobby_id: i32,
    pub self_id: i32,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: i32,
    pub room_id: i32,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientActorMessage {
    pub id: i32,
    pub room_id: i32,
    pub msg: WsMessage,
}
