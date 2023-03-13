pub use bevy_app;
pub use bevy_ecs;
pub use bevy_math;

pub mod prelude {
    pub use crate::codes::*;
    pub use crate::create_bevy_app;
    pub use crate::log;
    pub use rand::prelude::random;
    pub use wasm_bindgen;
    pub use wasm_bindgen::prelude::*;
}

use bevy_app::App;
use input::{Button, Input, MouseEvent};
use render::RenderPlugin;

pub use wasm_bindgen;
pub use wasm_bindgen::prelude::*;
pub mod codes;
pub mod input;
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

pub fn create_bevy_app(width: u32, height: u32) -> App {
    let mut app = App::new();

    // TODO: audio
    app.add_plugin(RenderPlugin { width, height })
        .add_event::<MouseEvent>()
        .init_resource::<Input<Button>>();

    app
}

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    log!("WASM import console#log");
    let mut app = create_bevy_app(1, 1);
    app.update();
    log!("WASM import bevy deps");
}
