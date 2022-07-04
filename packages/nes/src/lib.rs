// ref: https://github.com/lukexor/tetanes/blob/main/tetanes-web/src/lib.rs

use tetanes::{
    audio::{Audio, NesAudioCallback},
    common::{NesRegion, Powered},
    control_deck::ControlDeck,
    input::GamepadSlot,
    memory::RamState,
    ppu::{VideoFilter, RENDER_SIZE},
};
use wasm_bindgen::prelude::*;

mod utils;

#[wasm_bindgen]
pub enum Button {
    Poweroff,
    Reset,
    Select,
    Start,

    Joypad1A,
    Joypad1B,
    Joypad1TurboA,
    Joypad1TurboB,
    Joypad1Up,
    Joypad1Down,
    Joypad1Left,
    Joypad1Right,

    Joypad2A,
    Joypad2B,
    Joypad2TurboA,
    Joypad2TurboB,
    Joypad2Up,
    Joypad2Down,
    Joypad2Left,
    Joypad2Right,

    Joypad3A,
    Joypad3B,
    Joypad3TurboA,
    Joypad3TurboB,
    Joypad3Up,
    Joypad3Down,
    Joypad3Left,
    Joypad3Right,

    Joypad4A,
    Joypad4B,
    Joypad4TurboA,
    Joypad4TurboB,
    Joypad4Up,
    Joypad4Down,
    Joypad4Left,
    Joypad4Right,
}

#[wasm_bindgen]
pub struct Nes {
    control_deck: ControlDeck,
    audio: Audio,
    buffer: Vec<f32>,
    callback: NesAudioCallback,
    sound: bool,
    dynamic_rate_control: bool,
    dynamic_rate_delta: f32,
}

#[wasm_bindgen]
impl Nes {
    pub fn memory() -> JsValue {
        wasm_bindgen::memory()
    }

    pub fn new(output_sample_rate: f32, buffer_size: usize, max_delta: f32) -> Self {
        utils::set_panic_hook();

        let mut control_deck = ControlDeck::new(NesRegion::Ntsc, RamState::default());
        control_deck.set_filter(VideoFilter::Pixellate);
        let input_sample_rate = control_deck.apu().sample_rate();
        let mut audio = Audio::new(input_sample_rate, output_sample_rate, 4096);
        let buffer = vec![0.0; buffer_size];
        let callback = audio.open_callback().expect("valid callback");
        Self {
            control_deck,
            audio,
            buffer,
            callback,
            sound: false,
            dynamic_rate_control: true,
            dynamic_rate_delta: max_delta,
        }
    }

    pub fn sound(&mut self) -> bool {
        self.sound
    }

    pub fn set_sound(&mut self, enabled: bool) {
        self.sound = enabled;
    }

    pub fn power_cycle(&mut self) {
        self.control_deck.power_cycle();
    }

    pub fn frame(&mut self) -> *const u8 {
        self.control_deck.frame_buffer().as_ptr()
    }

    pub fn frame_len(&self) -> usize {
        RENDER_SIZE as usize
    }

    pub fn samples(&mut self) -> *const f32 {
        self.callback.read(&mut self.buffer);
        self.buffer.as_ptr()
    }

    pub fn sample_rate(&self) -> f32 {
        self.audio.output_frequency()
    }

    pub fn buffer_capacity(&self) -> usize {
        self.buffer.capacity()
    }

    pub fn clock_seconds(&mut self, seconds: f32) {
        self.control_deck
            .clock_seconds(seconds)
            .expect("valid clock");
        if self.sound {
            let samples = self.control_deck.audio_samples();
            self.audio
                .output(samples, self.dynamic_rate_control, self.dynamic_rate_delta);
        }
        self.control_deck.clear_audio_samples();
    }

    pub fn load_rom(&mut self, mut bytes: &[u8]) {
        self.control_deck
            .load_rom("ROM", &mut bytes)
            .expect("valid rom");
    }

    pub fn handle_event(&mut self, button: Button, pressed: bool, repeat: bool) -> bool {
        if repeat {
            return false;
        }
        let mut matched = true;

        let gamepad1 = &mut self.control_deck.gamepad_mut(GamepadSlot::One);
        match button {
            Button::Start => gamepad1.start = pressed,
            Button::Select => gamepad1.select = pressed,
            Button::Joypad1A => gamepad1.a = pressed,
            Button::Joypad1B => gamepad1.b = pressed,
            Button::Joypad1TurboA => gamepad1.turbo_a = pressed,
            Button::Joypad1TurboB => gamepad1.turbo_b = pressed,
            Button::Joypad1Up => gamepad1.up = pressed,
            Button::Joypad1Down => gamepad1.down = pressed,
            Button::Joypad1Left => gamepad1.left = pressed,
            Button::Joypad1Right => gamepad1.right = pressed,
            _ => {
                let gamepad2 = &mut self.control_deck.gamepad_mut(GamepadSlot::Two);
                match button {
                    Button::Joypad2A => gamepad2.a = pressed,
                    Button::Joypad2B => gamepad2.b = pressed,
                    Button::Joypad2TurboA => gamepad2.turbo_a = pressed,
                    Button::Joypad2TurboB => gamepad2.turbo_b = pressed,
                    Button::Joypad2Up => gamepad2.up = pressed,
                    Button::Joypad2Down => gamepad2.down = pressed,
                    Button::Joypad2Left => gamepad2.left = pressed,
                    Button::Joypad2Right => gamepad2.right = pressed,
                    _ => {
                        let gamepad3 = &mut self.control_deck.gamepad_mut(GamepadSlot::Three);
                        match button {
                            Button::Joypad3A => gamepad3.a = pressed,
                            Button::Joypad3B => gamepad3.b = pressed,
                            Button::Joypad3TurboA => gamepad3.turbo_a = pressed,
                            Button::Joypad3TurboB => gamepad3.turbo_b = pressed,
                            Button::Joypad3Up => gamepad3.up = pressed,
                            Button::Joypad3Down => gamepad3.down = pressed,
                            Button::Joypad3Left => gamepad3.left = pressed,
                            Button::Joypad3Right => gamepad3.right = pressed,
                            _ => {
                                let gamepad4 =
                                    &mut self.control_deck.gamepad_mut(GamepadSlot::Four);
                                match button {
                                    Button::Joypad4A => gamepad4.a = pressed,
                                    Button::Joypad4B => gamepad4.b = pressed,
                                    Button::Joypad4TurboA => gamepad4.turbo_a = pressed,
                                    Button::Joypad4TurboB => gamepad4.turbo_b = pressed,
                                    Button::Joypad4Up => gamepad4.up = pressed,
                                    Button::Joypad4Down => gamepad4.down = pressed,
                                    Button::Joypad4Left => gamepad4.left = pressed,
                                    Button::Joypad4Right => gamepad4.right = pressed,
                                    _ => matched = false,
                                }
                            }
                        }
                    }
                }
            }
        }
        matched
    }
}
