pub mod prelude {
    pub use crate::assets::*;
    pub use crate::audio::*;
    pub use crate::codes::*;
    pub use crate::create_bevy_app;
    pub use crate::input::*;
    pub use crate::log;
    pub use crate::pixels::*;
    pub use crate::render::*;
    pub use bevy::core::*;
    pub use bevy::ecs::system::*;
    pub use bevy::prelude::*;
    pub use nesbox_utils_macro::nesbox_bevy;
    pub use rand::prelude::random;
    pub use wasm_bindgen;
    pub use wasm_bindgen::prelude::*;
}

use assets::AssetsPlugin;
use audio::AudioPlugin;
use bevy::{prelude::*, time::TimePlugin};
use input::{ButtonInput, MouseEvent};
use pixels::Color;
use render::RenderPlugin;

pub use bevy;
pub use wasm_bindgen;
pub use wasm_bindgen::prelude::*;
pub mod assets;
pub mod audio;
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
        #[cfg(target_arch = "wasm32")]
        $crate::_log(&format!($($arg)*));
    }};
}

pub fn create_bevy_app(width: u32, height: u32, clear_color: Color) -> App {
    if height > 0xff {
        panic!("height too much big");
    }
    let mut app = App::new();

    #[cfg(debug_assertions)]
    app.add_plugin(bevy::log::LogPlugin::default());

    app.add_plugin(RenderPlugin {
        width,
        height,
        clear_color,
    })
    .add_plugin(AudioPlugin::default())
    .add_plugin(AssetsPlugin::default())
    .add_plugin(TaskPoolPlugin::default())
    .add_plugin(TypeRegistrationPlugin::default())
    .add_plugin(FrameCountPlugin::default())
    .add_plugin(TimePlugin::default())
    .add_plugin(TransformPlugin::default())
    .add_plugin(HierarchyPlugin::default())
    .add_event::<MouseEvent>()
    .init_resource::<ButtonInput>();

    app
}

#[wasm_bindgen(start)]
pub fn run() {
    let mut app = create_bevy_app(1, 1, Color::default());
    app.update();
    log!("WASM import bevy deps");
}
