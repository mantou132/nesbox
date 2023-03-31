// ref: https://github.com/lukexor/tetanes/blob/main/web/src/lib.rs

use nesbox_utils::prelude::*;
use tetanes::{
    audio::{AudioMixer, NesAudioCallback},
    common::{Kind, Reset},
    control_deck::ControlDeck,
    input::{FourPlayer, JoypadBtnState, Slot},
    mem::{Access, Mem, RamState},
    ppu::Ppu,
    video::VideoFilter,
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
        control_deck.set_four_player(FourPlayer::FourScore);
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
        Ppu::WIDTH
    }

    pub fn height(&self) -> u32 {
        Ppu::HEIGHT
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
            self.qoi_buffer =
                encode_qoi_frame(&self.prev_frame_buffer, buffer, Ppu::WIDTH, qoi_whole_frame);
            self.prev_frame_buffer = buffer.to_vec();
        } else {
            self.prev_frame_buffer = Vec::new();
        }
        buffer.as_ptr()
    }

    pub fn frame_len(&self) -> usize {
        Ppu::SIZE * 4
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

    pub fn handle_button_event(&mut self, player: Player, button: Button, pressed: bool) {
        let gamepad1 = &mut self.control_deck.joypad_mut(match player {
            Player::One => Slot::One,
            Player::Two => Slot::Two,
            Player::Three => Slot::Three,
            Player::Four => Slot::Four,
        });
        gamepad1.set_button(
            match button {
                Button::Start => JoypadBtnState::START,
                Button::Select => JoypadBtnState::SELECT,
                Button::JoypadA => JoypadBtnState::A,
                Button::JoypadB => JoypadBtnState::B,
                Button::JoypadTurboA => JoypadBtnState::TURBO_A,
                Button::JoypadTurboB => JoypadBtnState::TURBO_B,
                Button::JoypadUp => JoypadBtnState::UP,
                Button::JoypadDown => JoypadBtnState::DOWN,
                Button::JoypadLeft => JoypadBtnState::LEFT,
                Button::JoypadRight => JoypadBtnState::RIGHT,
                _ => return,
            },
            pressed,
        );
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

    pub fn ram(&mut self) -> Vec<u8> {
        // 2k(0u16..=0x07FF) ram + 8K(0x6000u16..=0x7FFF) sram
        let wram = self.control_deck.wram();
        let sram = self.control_deck.sram();
        log!("wram: {}, sram: {}", wram.len(), sram.len());
        let mut ram = vec![0; wram.len() + sram.len()];
        ram[..wram.len()].copy_from_slice(wram);
        ram[wram.len()..].copy_from_slice(sram);
        ram
    }

    pub fn read_ram(&mut self, addr: u16) -> u8 {
        self.control_deck.cpu().peek(addr, Access::Read)
    }

    pub fn write_ram(&mut self, addr: u16, val: u8) {
        self.control_deck.cpu_mut().write(addr, val, Access::Write);
    }
}
