// ref: https://github.com/lukexor/tetanes/blob/main/tetanes-web/src/lib.rs

use nesbox_utils::{
    input::{Button, Player},
    prelude::*,
};
use tetanes::{
    audio::{AudioMixer, NesAudioCallback},
    common::{Kind, Reset},
    control_deck::ControlDeck,
    input::GamepadSlot,
    memory::{MemRead, MemWrite, RamState},
    ppu::{VideoFilter, RENDER_HEIGHT, RENDER_SIZE, RENDER_WIDTH},
};

#[wasm_bindgen]
pub struct Nes {
    control_deck: ControlDeck,
    audio: AudioMixer,
    callback: NesAudioCallback,
    sound: bool,
    prev_frame_buffer: Vec<u8>,
    qoi_buffer: Vec<u8>,
    qoi_decode_buffer: Vec<u8>,
}

#[wasm_bindgen]
impl Nes {
    pub fn new(output_sample_rate: f32) -> Self {
        log!("Create nes emulator...");
        let mut control_deck = ControlDeck::new(RamState::default());
        control_deck.set_filter(VideoFilter::Pixellate);
        control_deck.set_fourscore(true);
        let mut audio = AudioMixer::new(control_deck.sample_rate(), output_sample_rate, 4096);
        let callback = audio.open_callback().expect("valid callback");
        Self {
            control_deck,
            audio,
            callback,
            sound: false,
            prev_frame_buffer: Vec::new(),
            qoi_buffer: Vec::new(),
            qoi_decode_buffer: Vec::new(),
        }
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

    pub fn set_filter(&mut self, filter: &str) {
        self.control_deck.set_filter(match filter {
            "NTSC" => VideoFilter::Ntsc,
            _ => VideoFilter::Pixellate,
        });
    }

    pub fn sound(&mut self) -> bool {
        self.sound
    }

    pub fn set_sound(&mut self, enabled: bool) {
        self.sound = enabled;
    }

    pub fn reset(&mut self) {
        self.control_deck.reset(Kind::Hard);
    }

    pub fn frame(&mut self, qoi: bool, qoi_whole_frame: bool) -> *const u8 {
        let buffer = self.control_deck.frame_buffer();
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

    pub fn audio_callback(&mut self, out: &mut [f32]) {
        self.callback.read(out);
    }

    pub fn clock_frame(&mut self) -> u32 {
        self.control_deck.clock_frame().expect("valid clock");
        if self.sound {
            let samples = self.control_deck.audio_samples();
            self.audio.consume(samples, true, 0.02);
        }
        self.control_deck.clear_audio_samples();
        self.control_deck.frame_number()
    }

    pub fn load_rom(&mut self, mut bytes: &[u8]) {
        self.control_deck
            .load_rom("ROM", &mut bytes)
            .expect("valid rom");
    }

    pub fn handle_button_event(&mut self, button: Button, pressed: bool, repeat: bool) {
        if repeat {
            return;
        }

        let gamepad1 = &mut self.control_deck.gamepad_mut(GamepadSlot::One);
        match button {
            Button::Start => gamepad1.start = pressed,
            Button::Select => gamepad1.select = pressed,
            Button::Joypad1A => gamepad1.a = pressed,
            Button::Joypad1B => gamepad1.b = pressed,
            Button::Joypad1TurboA => {
                gamepad1.a = pressed;
                gamepad1.turbo_a = pressed;
            }
            Button::Joypad1TurboB => {
                gamepad1.b = pressed;
                gamepad1.turbo_b = pressed;
            }
            Button::Joypad1Up => gamepad1.up = pressed,
            Button::Joypad1Down => gamepad1.down = pressed,
            Button::Joypad1Left => gamepad1.left = pressed,
            Button::Joypad1Right => gamepad1.right = pressed,
            _ => {
                let gamepad2 = &mut self.control_deck.gamepad_mut(GamepadSlot::Two);
                match button {
                    Button::Joypad2A => gamepad2.a = pressed,
                    Button::Joypad2B => gamepad2.b = pressed,
                    Button::Joypad2TurboA => {
                        gamepad2.a = pressed;
                        gamepad2.turbo_a = pressed;
                    }
                    Button::Joypad2TurboB => {
                        gamepad2.b = pressed;
                        gamepad2.turbo_b = pressed;
                    }
                    Button::Joypad2Up => gamepad2.up = pressed,
                    Button::Joypad2Down => gamepad2.down = pressed,
                    Button::Joypad2Left => gamepad2.left = pressed,
                    Button::Joypad2Right => gamepad2.right = pressed,
                    _ => {
                        let gamepad3 = &mut self.control_deck.gamepad_mut(GamepadSlot::Three);
                        match button {
                            Button::Joypad3A => gamepad3.a = pressed,
                            Button::Joypad3B => gamepad3.b = pressed,
                            Button::Joypad3TurboA => {
                                gamepad3.a = pressed;
                                gamepad3.turbo_a = pressed;
                            }
                            Button::Joypad3TurboB => {
                                gamepad3.b = pressed;
                                gamepad3.turbo_b = pressed;
                            }
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
                                    Button::Joypad4TurboA => {
                                        gamepad4.a = pressed;
                                        gamepad4.turbo_a = pressed;
                                    }
                                    Button::Joypad4TurboB => {
                                        gamepad4.b = pressed;
                                        gamepad4.turbo_b = pressed;
                                    }
                                    Button::Joypad4Up => gamepad4.up = pressed,
                                    Button::Joypad4Down => gamepad4.down = pressed,
                                    Button::Joypad4Left => gamepad4.left = pressed,
                                    Button::Joypad4Right => gamepad4.right = pressed,
                                    _ => {}
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    pub fn handle_motion_event(&mut self, _player: Player, _x: u32, _y: u32, _dx: f32, _dy: f32) {
        //
    }

    pub fn state(&mut self) -> Vec<u8> {
        serialize(self.control_deck.cpu()).unwrap_or_default()
    }

    pub fn load_state(&mut self, state: &[u8]) {
        if let Ok(cpu) = deserialize(&state) {
            self.control_deck.load_cpu(cpu);
        }
    }

    /// 2k(0u16..=0x07FF) ram + 8K(0x6000u16..=0x7FFF) sram
    pub fn ram(&mut self) -> Vec<u8> {
        let mut ram = Vec::new();
        for addr in 0u16..=0x07FF {
            ram.push(self.control_deck.cpu().bus.peek(addr));
        }
        for addr in 0x6000u16..=0x7FFF {
            ram.push(self.control_deck.cpu().bus.peek(addr));
        }
        ram
    }

    pub fn read_ram(&mut self, addr: u16) -> u8 {
        self.control_deck.cpu().bus.peek(addr)
    }

    pub fn write_ram(&mut self, addr: u16, val: u8) {
        self.control_deck.cpu_mut().bus.write(addr, val);
    }
}
