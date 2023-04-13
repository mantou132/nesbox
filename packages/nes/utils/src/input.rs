use bevy::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Hash, Clone, PartialEq, Eq, Debug, Default)]
pub enum Player {
    #[default]
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

    JoypadA,
    JoypadB,
    JoypadTurboA,
    JoypadTurboB,
    JoypadUp,
    JoypadDown,
    JoypadLeft,
    JoypadRight,
    PointerPrimary,
    PointerSecondary,

    JoypadC,
    JoypadTurboC,
}

#[derive(Debug, Clone, Resource, Default)]
pub struct ButtonInput {
    inputs: [Input<Button>; 4],
}

impl ButtonInput {
    pub fn get_input(&self, player: Player) -> &Input<Button> {
        match player {
            Player::One => &self.inputs[0],
            Player::Two => &self.inputs[1],
            Player::Three => &self.inputs[2],
            Player::Four => &self.inputs[3],
        }
    }

    pub fn get_input_mut(&mut self, player: Player) -> &mut Input<Button> {
        match player {
            Player::One => &mut self.inputs[0],
            Player::Two => &mut self.inputs[1],
            Player::Three => &mut self.inputs[2],
            Player::Four => &mut self.inputs[3],
        }
    }

    pub fn clear(&mut self) {
        for input in self.inputs.iter_mut() {
            input.clear();
        }
    }
}
