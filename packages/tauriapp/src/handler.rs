use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use tauri::{command, AppHandle, Runtime};

use crate::settings::SETTINGS;

#[command]
pub fn set_branch<R: Runtime>(branch: &str, app_handle: AppHandle<R>) {
    let mut settings = SETTINGS.lock().unwrap();
    settings.branch = branch.to_owned();
    settings.save();
    app_handle.restart();
}

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
pub fn set_badge(count: i32) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    unsafe {
        use cocoa::{appkit::NSApp, base::nil, foundation::NSString};

        let label = if count == 0 {
            nil
        } else {
            NSString::alloc(nil).init_str(&format!("{}", count))
        };
        let dock_tile: cocoa::base::id = msg_send![NSApp(), dockTile];
        let _: cocoa::base::id = msg_send![dock_tile, setBadgeLabel: label];
    }

    #[cfg(target_os = "windows")]
    {
        use windows::{
            Data::Xml::Dom::XmlDocument,
            UI::Notifications::{BadgeNotification, BadgeUpdateManager},
        };

        let xml = XmlDocument::new().unwrap();
        xml.LoadXml(format!(r#"<badge value="{}"/>"#, count))
            .unwrap();

        let badge = BadgeNotification::CreateBadgeNotification(xml).unwrap();

        BadgeUpdateManager::CreateBadgeUpdaterForApplication()
            .map(|badge_updater| badge_updater.Update(badge).unwrap())
            .map_err(|err| err.message().to_string())?;
    }
    Ok(())
}
