#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
use window_shadows::set_shadow;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use tauri::Manager;
#[cfg(target_os = "macos")]
use tauri::Menu;
#[cfg(target_os = "macos")]
use window_ext::WindowExt;

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
                win.set_decorations(false).ok();
                set_shadow(&win, true).ok();
            }
            #[cfg(target_os = "macos")]
            {
                // https://github.com/tauri-apps/tauri/issues/2663#issuecomment-1151240533
                main_window.set_transparent_titlebar(true, false);
            }

            // win.open_devtools();
            Ok(())
        })
        .plugin(preload::PreloadPlugin::new())
        .run(context)
        .expect("error while running tauri application");
}
