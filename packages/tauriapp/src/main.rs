#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use tauri::{generate_handler, Manager, Window};
#[cfg(target_os = "macos")]
use tauri::{Menu, WindowEvent};

use handler::{play_sound, set_badge};

mod handler;
mod preload;
mod window_ext;

fn main() {
    let builder = tauri::Builder::default();
    let context = tauri::generate_context!();

    #[cfg(target_os = "macos")]
    let builder = builder
        .menu(Menu::os_default(&context.package_info().name))
        .on_window_event(|event| match event.event() {
            // bug: when enter fullscreen emit moved event
            WindowEvent::Resized(_) | WindowEvent::Moved(_) => {
                use window_ext::WindowExt;
                // https://github.com/tauri-apps/tauri/issues/4519
                let monitor = event.window().current_monitor().unwrap().unwrap();
                let screen = monitor.size();
                let size = &event.window().outer_size().unwrap();
                event.window().set_toolbar_visible(size != screen);
            }
            _ => {}
        });

    builder
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            #[cfg(any(target_os = "windows", target_os = "macos"))]
            {
                use window_ext::WindowExt;
                main_window.set_background();
                main_window.set_transparent_titlebar();
            }
            // main_window.open_devtools();
            Ok(())
        })
        .on_page_load(|w: Window, _| w.get_window("main").unwrap().show().unwrap())
        .plugin(preload::PreloadPlugin::new())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .set_auto_show(false)
                .build(),
        )
        .invoke_handler(generate_handler![play_sound, set_badge])
        .run(context)
        .expect("error while running tauri application");
}
