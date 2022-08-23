use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc::Sender;
use tokio::sync::Mutex;

use webrtc::api::interceptor_registry::register_default_interceptors;
use webrtc::api::media_engine::{MediaEngine, MIME_TYPE_OPUS};
use webrtc::api::APIBuilder;
use webrtc::ice_transport::ice_server::RTCIceServer;
use webrtc::interceptor::registry::Registry;
use webrtc::peer_connection::configuration::RTCConfiguration;
use webrtc::peer_connection::peer_connection_state::RTCPeerConnectionState;
use webrtc::peer_connection::RTCPeerConnection;
use webrtc::rtp_transceiver::rtp_codec::RTCRtpCodecCapability;
use webrtc::rtp_transceiver::rtp_codec::RTPCodecType;
use webrtc::rtp_transceiver::rtp_receiver::RTCRtpReceiver;
use webrtc::track::track_local::track_local_static_rtp::TrackLocalStaticRTP;
use webrtc::track::track_local::{TrackLocal, TrackLocalWriter};
use webrtc::track::track_remote::TrackRemote;
use webrtc::Error;

struct ConnState {
    conn: Arc<RTCPeerConnection>,
    sender: Arc<Sender<Arc<TrackLocalStaticRTP>>>,
    track: Arc<TrackLocalStaticRTP>,
}

lazy_static! {
    static ref ROOM_USER_CONN_STATE_MAP: Mutex<HashMap<i32, HashMap<i32, ConnState>>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

pub async fn create_rtc(
    user_id: i32,
    room_id: i32,
    sdp: String,
    is_upgrade: bool,
    callback: impl Fn(String) -> (),
) -> Result<(), Error> {
    if is_upgrade {
        if let Some(state) = ROOM_USER_CONN_STATE_MAP
            .lock()
            .await
            .get(&room_id)
            .and_then(|map| map.get(&user_id))
        {
            state
                .conn
                .set_remote_description(serde_json::from_str(&sdp).unwrap())
                .await
                .ok();

            log::debug!("webrtc updated anwser");
            return Ok(());
        }
    }

    // Create a MediaEngine object to configure the supported codec
    let mut m = MediaEngine::default();

    m.register_default_codecs()?;

    // Create a InterceptorRegistry. This is the user configurable RTP/RTCP Pipeline.
    // This provides NACKs, RTCP Reports and other features. If you use `webrtc.NewPeerConnection`
    // this is enabled by default. If you are manually managing You MUST create a InterceptorRegistry
    // for each PeerConnection.
    let mut registry = Registry::new();

    // Use the default set of Interceptors
    registry = register_default_interceptors(registry, &mut m)?;

    // Create the API object with the MediaEngine
    let api = APIBuilder::new()
        .with_media_engine(m)
        .with_interceptor_registry(registry)
        .build();

    // Prepare the configuration
    let config = RTCConfiguration {
        ice_servers: vec![RTCIceServer {
            urls: vec!["stun:stun.l.google.com:19302".to_owned()],
            ..Default::default()
        }],
        ..Default::default()
    };

    // Create a new RTCPeerConnection
    let peer_connection = Arc::new(api.new_peer_connection(config).await?);

    // It will generate extra track, but it can maintain the correct ID of the second track
    peer_connection
        .add_transceiver_from_kind(RTPCodecType::Audio, &[])
        .await?;

    let (local_track_chan_tx, mut local_track_chan_rx) =
        tokio::sync::mpsc::channel::<Arc<TrackLocalStaticRTP>>(1);
    let local_track_chan_tx = Arc::new(local_track_chan_tx);

    peer_connection
        .on_track(Box::new(
            move |track: Option<Arc<TrackRemote>>, _receiver: Option<Arc<RTCRtpReceiver>>| {
                if let Some(track) = track {
                    tokio::spawn(async move {
                        // Create Track that we send video back to browser on
                        let local_track = Arc::new(TrackLocalStaticRTP::new(
                            track.codec().await.capability,
                            user_id.to_string(),
                            "webrtc-rs".to_owned(),
                        ));

                        if let Some(room) = ROOM_USER_CONN_STATE_MAP.lock().await.get_mut(&room_id)
                        {
                            for (key, val) in room.iter_mut() {
                                if key == &user_id {
                                    val.track = local_track.clone();
                                } else {
                                    let _ = val.sender.send(local_track.clone()).await;
                                }
                            }
                        }

                        // Read RTP packets being sent to webrtc-rs
                        while let Ok((rtp, _)) = track.read_rtp().await {
                            if let Err(err) = local_track.write_rtp(&rtp).await {
                                if Error::ErrClosedPipe != err {
                                    print!("output track write_rtp got error: {} and break", err);
                                    break;
                                } else {
                                    print!("output track write_rtp got error: {}", err);
                                }
                            }
                        }
                    });
                }

                Box::pin(async {})
            },
        ))
        .await;

    let pc2 = peer_connection.clone();
    let tx2 = local_track_chan_tx.clone();
    // Set the handler for Peer connection state
    // This will notify you when the peer has connected/disconnected
    peer_connection
        .on_peer_connection_state_change(Box::new(move |state: RTCPeerConnectionState| {
            log::debug!("Peer Connection State has changed: {}", state);

            let pc3 = pc2.clone();
            let tx3 = tx2.clone();
            tokio::spawn(async move {
                match state {
                    RTCPeerConnectionState::Failed
                    | RTCPeerConnectionState::Disconnected
                    | RTCPeerConnectionState::Closed => {
                        let mut mutex = ROOM_USER_CONN_STATE_MAP.lock().await;
                        let option_room = mutex.get_mut(&room_id);

                        if let Some(room) = option_room {
                            room.remove(&user_id);

                            for (key, val) in room.iter() {
                                if key != &user_id {
                                    let _ = val
                                        .sender
                                        .send(Arc::new(TrackLocalStaticRTP::new(
                                            RTCRtpCodecCapability {
                                                mime_type: MIME_TYPE_OPUS.to_owned(),
                                                ..Default::default()
                                            },
                                            user_id.to_string(),
                                            "webrtc-rs".to_owned(),
                                        )))
                                        .await;
                                }
                            }

                            if room.len() == 0 {
                                mutex.remove(&room_id);
                            }
                        }
                    }
                    RTCPeerConnectionState::Connected => {
                        ROOM_USER_CONN_STATE_MAP
                            .lock()
                            .await
                            .entry(room_id)
                            .or_insert(HashMap::new())
                            .insert(
                                user_id,
                                ConnState {
                                    conn: pc3,
                                    sender: tx3,
                                    track: Arc::new(TrackLocalStaticRTP::new(
                                        RTCRtpCodecCapability {
                                            mime_type: MIME_TYPE_OPUS.to_owned(),
                                            ..Default::default()
                                        },
                                        user_id.to_string(),
                                        "webrtc-rs".to_owned(),
                                    )),
                                },
                            );
                    }
                    _ => (),
                }
            });
            Box::pin(async {})
        }))
        .await;

    if let Some(room) = ROOM_USER_CONN_STATE_MAP.lock().await.get(&room_id) {
        for (key, val) in room.iter() {
            if key != &user_id {
                peer_connection
                    .add_track(val.track.clone() as Arc<dyn TrackLocal + Send + Sync>)
                    .await?;
            }
        }
    }

    // Set the remote SessionDescription
    peer_connection
        .set_remote_description(serde_json::from_str(&sdp).unwrap())
        .await?;

    // Create an answer
    let answer = peer_connection.create_answer(None).await?;

    // Create channel that is blocked until ICE Gathering is complete
    let mut gather_complete = peer_connection.gathering_complete_promise().await;

    // Sets the LocalDescription, and starts our UDP listeners
    peer_connection.set_local_description(answer).await?;

    // Block until ICE Gathering is complete, disabling trickle ICE
    // we do this because we only can exchange one signaling message
    // in a production application you should exchange ICE Candidates via OnICECandidate
    let _ = gather_complete.recv().await;

    if let Some(local_desc) = peer_connection.local_description().await {
        let json = serde_json::to_string(&local_desc).unwrap();
        callback(json);
    }

    loop {
        if let Some(local_track) = local_track_chan_rx.recv().await {
            if let Some(room) = ROOM_USER_CONN_STATE_MAP.lock().await.get(&room_id) {
                if !room.contains_key(&local_track.id().parse::<i32>().unwrap_or(0)) {
                    for sender in peer_connection.get_senders().await {
                        if let Some(track) = sender.track().await {
                            if track.id() == local_track.id() {
                                let _ = peer_connection.remove_track(&sender).await;
                            }
                        }
                    }
                } else {
                    peer_connection
                        .add_track(local_track.clone() as Arc<dyn TrackLocal + Send + Sync>)
                        .await?;
                }

                let offer = peer_connection.create_offer(None).await?;
                peer_connection.set_local_description(offer).await?;
                if let Some(local_desc) = peer_connection.local_description().await {
                    log::debug!("webrtc send offer");
                    let json = serde_json::to_string(&local_desc).unwrap();
                    callback(json);
                }
            }
        }
    }
}
