use game::*;
use nesbox_utils::{
    bevy_app::App, bevy_ecs::prelude::*, bevy_ecs::system::*, bevy_math::Vec2, input::*,
    prelude::*, render::*,
};

mod game;

#[wasm_bindgen]
pub struct Nes {
    frame_number: u32,
    sound: bool,
    prev_frame_buffer: Vec<u8>,
    qoi_buffer: Vec<u8>,
    qoi_decode_buffer: Vec<u8>,
    app: App,
}

#[wasm_bindgen]
impl Nes {
    pub fn new(_output_sample_rate: f32) -> Self {
        log!("Create bevy app...");
        let nes = Self {
            frame_number: 0,
            sound: false,
            prev_frame_buffer: Vec::new(),
            qoi_buffer: Vec::new(),
            qoi_decode_buffer: Vec::new(),
            app: game::create_app(),
        };
        nes
    }

    pub fn mem(&mut self) -> JsValue {
        wasm_bindgen::memory()
    }

    pub fn width(&self) -> u32 {
        RENDER_WIDTH
    }

    pub fn height(&self) -> u32 {
        RENDER_HEIGHT
    }

    pub fn set_filter(&mut self, _filter: &str) {
        //
    }

    pub fn sound(&mut self) -> bool {
        self.sound
    }

    pub fn set_sound(&mut self, enabled: bool) {
        self.sound = enabled;
    }

    pub fn reset(&mut self) {
        //
    }

    pub fn frame(&mut self, qoi: bool, qoi_whole_frame: bool) -> *const u8 {
        let binding = self.app.world.get_resource::<PixelsResource>().unwrap();
        let buffer = binding.frame();
        if qoi {
            self.qoi_buffer = encode_qoi_frame(
                &self.prev_frame_buffer,
                buffer,
                RENDER_WIDTH,
                qoi_whole_frame,
            );
            self.prev_frame_buffer = buffer.to_vec();
        } else {
            self.prev_frame_buffer = Vec::new();
        }
        buffer.as_ptr()
    }

    pub fn frame_len(&self) -> usize {
        RENDER_SIZE as usize
    }

    pub fn qoi_frame(&mut self) -> *const u8 {
        self.qoi_buffer.as_ptr()
    }

    pub fn qoi_frame_len(&self) -> usize {
        self.qoi_buffer.len()
    }

    pub fn decode_qoi(&mut self, bytes: &[u8]) -> *const u8 {
        self.qoi_decode_buffer = decode_qoi_frame(bytes);
        self.qoi_decode_buffer.as_ptr()
    }

    pub fn decode_qoi_len(&self) -> usize {
        self.qoi_decode_buffer.len()
    }

    pub fn audio_callback(&mut self, _out: &mut [f32]) {
        // TODO
    }

    pub fn clock_frame(&mut self) -> u32 {
        self.frame_number += 1;
        self.app.update();
        self.app
            .world
            .get_resource_mut::<Input<Button>>()
            .unwrap()
            .clear();
        self.frame_number
    }

    pub fn load_rom(&mut self, mut _bytes: &[u8]) {
        //
    }

    pub fn handle_button_event(&mut self, button: Button, pressed: bool, repeat: bool) {
        if repeat {
            return;
        }
        let mut input = self.app.world.get_resource_mut::<Input<Button>>().unwrap();
        if pressed {
            input.press(button);
        } else {
            input.release(button);
        }
    }

    pub fn handle_motion_event(&mut self, player: Player, x: f32, y: f32, dx: f32, dy: f32) {
        let mut system_state: SystemState<EventWriter<MouseEvent>> =
            SystemState::new(&mut self.app.world);
        let mut mouse_motion = system_state.get_mut(&mut self.app.world);

        mouse_motion.send(MouseEvent {
            player,
            delta: Vec2::new(x, y),
            position: Vec2::new(dx, dy),
        });
    }

    pub fn state(&mut self) -> Vec<u8> {
        Vec::new()
    }

    pub fn load_state(&mut self, _state: &[u8]) {
        //
    }

    pub fn ram(&mut self) -> Vec<u8> {
        Vec::new()
    }

    pub fn read_ram(&mut self, _addr: u16) -> u8 {
        0
    }

    pub fn write_ram(&mut self, _addr: u16, _val: u8) {
        //
    }
}
