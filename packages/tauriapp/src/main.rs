#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use preload::PreloadPlugin;
use tauri::{Manager, Menu, MenuItem, Submenu};
use window_ext::WindowExt;

mod preload;
mod window_ext;

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
    tauri::Builder::default()
        .menu(get_default_menu())
        .setup(|app| {
            let win = app.get_window("main").unwrap();
            // https://github.com/tauri-apps/tauri/issues/2663#issuecomment-1151240533
            win.set_transparent_titlebar(true, false);
            // win.open_devtools();
            Ok(())
        })
        .plugin(PreloadPlugin::new())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
