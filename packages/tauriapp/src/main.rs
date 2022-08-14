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
use window_ext::WindowExt;

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
        .on_window_event(|event| {
            let size = &event.window().outer_size().unwrap();
            match event.event() {
                // bug: when enter fullscreen emit moved event
                WindowEvent::Resized(_) | WindowEvent::Moved(_) => {
                    // https://github.com/tauri-apps/tauri/issues/4519
                    let monitor = event.window().current_monitor().unwrap().unwrap();
                    let screen = monitor.size();
                    event.window().set_toolbar_visible(size != screen);
                }
                _ => {}
            }
        });

    builder
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            main_window.set_background();
            main_window.set_transparent_titlebar();
            // main_window.open_devtools();
            Ok(())
        })
        .on_page_load(|w: Window, _| w.get_window("main").unwrap().show().unwrap())
        .plugin(preload::PreloadPlugin::new())
        .invoke_handler(generate_handler![play_sound, set_badge])
        .run(context)
        .expect("error while running tauri application");
}
