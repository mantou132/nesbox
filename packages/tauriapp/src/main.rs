#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
use window_shadows::set_shadow;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[cfg(target_os = "macos")]
use tauri::Menu;
use tauri::{generate_handler, Manager, Window, WindowEvent};
#[cfg(target_os = "macos")]
use window_ext::WindowExt;

use handler::{play_sound, set_badge};

mod handler;
mod preload;
mod window_ext;

fn main() {
    let builder = tauri::Builder::default();
    let context = tauri::generate_context!();

    #[cfg(target_os = "macos")]
    let builder = builder.menu(Menu::os_default(&context.package_info().name));

    builder
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            #[cfg(target_os = "windows")]
            {
                main_window.set_decorations(false).ok();
                set_shadow(&main_window, true).ok();
            }
            #[cfg(target_os = "macos")]
            {
                main_window.set_window_style(true, false);
            }

            // main_window.open_devtools();
            Ok(())
        })
        .on_window_event(|event| match event.event() {
            #[cfg(target_os = "macos")]
            WindowEvent::Resized(size) => {
                // https://github.com/tauri-apps/tauri/issues/4519
                let monitor = event.window().current_monitor().unwrap().unwrap();
                let screen = monitor.size();
                event.window().set_toolbar_visible(size != screen);
            }
            _ => {}
        })
        .on_page_load(|w: Window, _| w.get_window("main").unwrap().show().unwrap())
        .plugin(preload::PreloadPlugin::new())
        .invoke_handler(generate_handler![play_sound, set_badge])
        .run(context)
        .expect("error while running tauri application");
}
