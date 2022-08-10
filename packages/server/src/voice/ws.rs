use std::time::{Duration, Instant};

use actix::{
    fut, Actor, ActorContext, ActorFutureExt, Addr, AsyncContext, ContextFutureSpawner, Handler,
    Running, StreamHandler, WrapFuture,
};
use actix_web_actors::ws;
use actix_web_actors::ws::Message::*;

use super::{
    lobby::Lobby,
    messages::{ClientActorMessage, Connect, Disconnect, WsMessage},
};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub struct WsConn {
    id: i32,
    room: i32,
    lobby_addr: Addr<Lobby>,
    hb: Instant,
}

impl WsConn {
    pub fn new(id: i32, room: i32, lobby: Addr<Lobby>) -> WsConn {
        WsConn {
            id,
            room,
            hb: Instant::now(),
            lobby_addr: lobby,
        }
    }

    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                log::debug!("Disconnecting failed heartbeat");
                act.lobby_addr.do_send(Disconnect {
                    id: act.id,
                    room_id: act.room,
                });
                ctx.stop();
                return;
            }

            ctx.ping(b"hi");
        });
    }
}

impl Actor for WsConn {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);

        let addr = ctx.address();
        self.lobby_addr
            .send(Connect {
                addr: addr.recipient(),
                lobby_id: self.room,
                self_id: self.id,
            })
            .into_actor(self)
            .then(|res, _, ctx| {
                match res {
                    Ok(_res) => (),
                    _ => ctx.stop(),
                }
                fut::ready(())
            })
            .wait(ctx);
        log::debug!("{} voice started", self.id);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        log::debug!("{} voice stopping", self.id);
        self.lobby_addr.do_send(Disconnect {
            id: self.id,
            room_id: self.room,
        });
        Running::Stop
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsConn {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(Text(s)) => self.lobby_addr.do_send(ClientActorMessage {
                id: self.id,
                msg: WsMessage::Text(s.into()),
                room_id: self.room,
            }),
            Ok(Binary(bin)) => self.lobby_addr.do_send(ClientActorMessage {
                id: self.id,
                msg: WsMessage::Binary(bin),
                room_id: self.room,
            }),
            Ok(Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            Ok(Continuation(_)) => {
                ctx.stop();
            }
            _ => (),
        }
    }
}

impl Handler<WsMessage> for WsConn {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) {
        match msg {
            WsMessage::Text(s) => ctx.text(s),
            WsMessage::Binary(bin) => ctx.binary(bin),
        }
    }
}
