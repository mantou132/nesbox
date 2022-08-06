use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use tauri::command;

#[cfg(target_os = "macos")]
use cocoa::{appkit::NSApp, base::nil, foundation::NSString};

#[command]
pub async fn play_sound(kind: &str, volume: f32) -> Result<(), String> {
    if volume < 0.03 {
        return Ok(());
    }

    let (_stream, stream_handle) = OutputStream::try_default().map_err(|_| "".to_string())?;
    let sink = Sink::try_new(&stream_handle).map_err(|_| "".to_string())?;

    let file = match kind {
        "new_invite" => Cursor::new(include_bytes!("new_invite.aac").as_ref()),
        "joined" => Cursor::new(include_bytes!("joined.aac").as_ref()),
        "sended" => Cursor::new(include_bytes!("sended.aac").as_ref()),
        "received" => Cursor::new(include_bytes!("received.aac").as_ref()),
        _ => Cursor::new(include_bytes!("new_message.aac").as_ref()),
    };

    let source = Decoder::new(file).map_err(|_| "".to_string())?;
    sink.set_volume(volume);
    sink.append(source);
    sink.sleep_until_end();

    Ok(())
}

#[command]
pub fn set_badge(count: i32) {
    #[cfg(target_os = "macos")]
    unsafe {
        let label = if count == 0 {
            nil
        } else {
            NSString::alloc(nil).init_str(&format!("{}", count))
        };
        let dock_tile: cocoa::base::id = msg_send![NSApp(), dockTile];
        let _: cocoa::base::id = msg_send![dock_tile, setBadgeLabel: label];
    }
}
