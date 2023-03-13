use bevy_app::*;
use bevy_ecs::prelude::*;

#[derive(Resource)]
pub struct PixelsResource {
    pub width: u32,
    pub height: u32,
    pixels: Vec<u8>,
}

impl PixelsResource {
    pub fn frame(&self) -> &[u8] {
        &self.pixels
    }

    pub fn get_frame_mut(&mut self) -> &mut [u8] {
        &mut self.pixels
    }
}

#[derive(Default, Debug)]
pub struct RenderPlugin {
    pub width: u32,
    pub height: u32,
}

impl Plugin for RenderPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(PixelsResource {
            width: self.width,
            height: self.height,
            pixels: vec![0u8; (self.width * self.height * 4) as usize],
        })
        .add_system(Self::render_rect);
    }
}

#[derive(Component, Debug)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Component, Debug)]
pub struct Velocity {
    pub x: i32,
    pub y: i32,
}

#[derive(Component, Debug)]
pub struct Size {
    pub width: u32,
    pub height: u32,
}

#[derive(Component, Debug)]
pub struct Color(pub u8, pub u8, pub u8, pub u8);

impl RenderPlugin {
    pub fn render_rect(
        mut pixels_resource: ResMut<PixelsResource>,
        query: Query<(&Position, &Size, &Color)>,
    ) {
        let width = pixels_resource.width as i32;
        let height = pixels_resource.height as i32;
        let frame_width_bytes = (width * 4) as usize;
        let frame = pixels_resource.get_frame_mut();

        for (position, size, color) in query.iter() {
            let s_width = size.width as i32;
            let s_height = size.height as i32;
            let x_offset = std::cmp::max(0, position.x) as usize * 4;
            let render_width =
                std::cmp::min(position.x + s_width, width) - std::cmp::max(0, position.x);
            if render_width <= 0 {
                break;
            }
            let width_bytes = (render_width * 4) as usize;
            let object_row = &[color.0, color.1, color.2, color.3].repeat(render_width as usize);

            for y in position.y..(position.y + s_height) {
                if y < 0 {
                    continue;
                }
                if y >= height {
                    break;
                }
                let y_offset = y as usize * frame_width_bytes;
                let i = y_offset + x_offset;
                let j = i + width_bytes;

                frame[i..j].copy_from_slice(object_row);
            }
        }
    }
}
