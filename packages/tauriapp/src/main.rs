#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
use window_shadows::set_shadow;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use preload::PreloadPlugin;
use tauri::Manager;
#[cfg(target_os = "macos")]
use tauri::{Menu, MenuItem, Submenu};
#[cfg(target_os = "macos")]
use window_ext::WindowExt;

mod preload;
mod window_ext;

#[cfg(target_os = "macos")]
fn get_default_menu() -> Menu {
    Menu::new()
        .add_submenu(Submenu::new(
            "NESBox",
            Menu::new()
                .add_native_item(MenuItem::Hide)
                .add_native_item(MenuItem::HideOthers)
                .add_native_item(MenuItem::ShowAll)
                .add_native_item(MenuItem::Quit),
        ))
        .add_submenu(Submenu::new(
            "Edit",
            Menu::new()
                .add_native_item(MenuItem::Copy)
                .add_native_item(MenuItem::Cut)
                .add_native_item(MenuItem::Paste)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Undo)
                .add_native_item(MenuItem::Redo)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::SelectAll),
        ))
}

fn main() {
    let builder = tauri::Builder::default();

    #[cfg(target_os = "macos")]
    let builder = builder.menu(get_default_menu());

    builder
        .setup(|app| {
            let win = app.get_window("main").unwrap();
            #[cfg(target_os = "windows")]
            {
                win.set_decorations(false).ok();
                set_shadow(&win, true).ok();
            }
            #[cfg(target_os = "macos")]
            {
                // https://github.com/tauri-apps/tauri/issues/2663#issuecomment-1151240533
                win.set_transparent_titlebar(true, false);
            }
            // win.open_devtools();
            Ok(())
        })
        .plugin(PreloadPlugin::new())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
