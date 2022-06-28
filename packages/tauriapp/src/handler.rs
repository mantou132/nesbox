use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use tauri::command;

#[command]
pub async fn play_sound(kind: &str, volume: f32) -> Result<(), String> {
    if volume < 0.03 {
        return Ok(());
    }

    let (_stream, stream_handle) = OutputStream::try_default().map_err(|_| "".to_string())?;
    let sink = Sink::try_new(&stream_handle).map_err(|_| "".to_string())?;

    let file = match kind {
        "new_invite" => Cursor::new(include_bytes!("new_invite.aac").as_ref()),
        _ => Cursor::new(include_bytes!("new_message.aac").as_ref()),
    };

    let source = Decoder::new(file).map_err(|_| "".to_string())?;
    sink.set_volume(volume);
    sink.append(source);
    sink.sleep_until_end();

    Ok(())
}
