#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;
#[macro_use]
extern crate lazy_static;

use std::{env, fs};

#[cfg(target_os = "macos")]
use tauri::Menu;
use tauri::{api::path::app_dir, generate_handler, Window, WindowEvent};

use handler::*;
use settings::*;
use tauri_plugin_window_state::STATE_FILENAME;

mod handler;
mod preload;
mod settings;
mod window_ext;

fn main() {
    let builder = tauri::Builder::default();
    let mut context = tauri::generate_context!();

    // release mutex
    {
        let mut settings = SETTINGS.lock().unwrap();
        settings.load(app_dir(context.config()).unwrap());

        if let Some(url) = settings.get_branch_url() {
            context.config_mut().build.dist_dir = url;
        }
    }

    if env::var("NEW_STATE").is_ok() {
        fs::remove_file(app_dir(context.config()).unwrap().join(STATE_FILENAME)).ok();
    }

    #[cfg(target_os = "macos")]
    let builder = builder.menu(Menu::os_default(&context.package_info().name));

    #[cfg(target_os = "windows")]
    let builder = builder.setup(|app| {
        use tauri::Manager;
        // windows main window create not trigger in `on_window_event`
        let main_window = app.get_window("main").unwrap();
        use window_ext::WindowExt;
        main_window.set_background();
        main_window.set_transparent_titlebar();
        Ok(())
    });

    builder
        .on_page_load(|w: Window, _| w.show().unwrap())
        .on_window_event(|event| match event.event() {
            WindowEvent::Resized(_) | WindowEvent::Moved(_) => {
                let window = event.window();
                #[cfg(any(target_os = "windows", target_os = "macos"))]
                // created event，new window
                {
                    use window_ext::WindowExt;
                    window.set_background();
                    window.set_transparent_titlebar();
                }
                #[cfg(target_os = "macos")]
                // fullscreen/resized event
                // bug: when enter fullscreen emit moved event
                {
                    use window_ext::WindowExt;
                    // https://github.com/tauri-apps/tauri/issues/4519
                    let monitor = window.current_monitor().unwrap().unwrap();
                    let screen = monitor.size();
                    let size = &window.outer_size().unwrap();
                    event.window().set_toolbar_visible(size != screen);
                }
            }
            _ => {}
        })
        .plugin(preload::PreloadPlugin::new())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .set_auto_show(false)
                .build(),
        )
        .invoke_handler(generate_handler![play_sound, set_badge, set_branch])
        .run(context)
        .expect("error while running tauri application");
}
