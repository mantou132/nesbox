pub mod prelude {
    pub use crate::codes::*;
    pub use crate::create_bevy_app;
    pub use crate::log;
    pub use crate::pixels::*;
    pub use bevy::prelude::*;
    pub use rand::prelude::random;
    pub use wasm_bindgen;
    pub use wasm_bindgen::prelude::*;
}

use bevy::{prelude::*, time::TimePlugin};
use input::{Button, Input, MouseEvent};
use pixels::Color;
use render::RenderPlugin;

pub use bevy;
pub use wasm_bindgen;
pub use wasm_bindgen::prelude::*;
pub mod codes;
pub mod input;
pub mod pixels;
pub mod render;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn _log(s: &str);
}

#[macro_export]
macro_rules! log {
    ($($arg:tt)*) => {{
        $crate::_log(&format!($($arg)*));
    }};
}

pub fn create_bevy_app(width: u32, height: u32, clear_color: Color) -> App {
    let mut app = App::new();

    #[cfg(debug_assertions)]
    app.add_plugin(bevy::log::LogPlugin::default());

    // TODO: audio
    app.add_plugin(RenderPlugin {
        width,
        height,
        clear_color,
    })
    .add_plugin(TaskPoolPlugin::default())
    .add_plugin(TypeRegistrationPlugin::default())
    .add_plugin(FrameCountPlugin::default())
    .add_plugin(TimePlugin::default())
    .add_plugin(TransformPlugin::default())
    .add_plugin(HierarchyPlugin::default())
    .add_event::<MouseEvent>()
    .init_resource::<Input<Button>>();

    app
}

#[wasm_bindgen(start)]
pub fn run() {
    let mut app = create_bevy_app(1, 1, Color::default());
    app.update();
    log!("WASM import bevy deps");
}