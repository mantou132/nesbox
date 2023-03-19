pub use bevy::input::*;

use bevy::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Hash, Clone, PartialEq, Eq, Debug)]
pub enum Player {
    One,
    Two,
    Three,
    Four,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MouseEvent {
    pub player: Player,
    pub delta: Vec2,
    pub position: Vec2,
}

#[wasm_bindgen]
#[derive(Copy, Hash, Clone, PartialEq, Eq, Debug)]
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
    Pointer1Left,
    Pointer1Right,

    Joypad2A,
    Joypad2B,
    Joypad2TurboA,
    Joypad2TurboB,
    Joypad2Up,
    Joypad2Down,
    Joypad2Left,
    Joypad2Right,
    Pointer2Left,
    Pointer2Right,

    Joypad3A,
    Joypad3B,
    Joypad3TurboA,
    Joypad3TurboB,
    Joypad3Up,
    Joypad3Down,
    Joypad3Left,
    Joypad3Right,
    Pointer3Left,
    Pointer3Right,

    Joypad4A,
    Joypad4B,
    Joypad4TurboA,
    Joypad4TurboB,
    Joypad4Up,
    Joypad4Down,
    Joypad4Left,
    Joypad4Right,
    Pointer4Left,
    Pointer4Right,
}
