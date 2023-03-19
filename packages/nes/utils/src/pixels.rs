use bevy::prelude::*;

#[derive(Resource)]
pub struct PixelsResource {
    pub width: u32,
    pub height: u32,
    buffer: Vec<u8>,
}

#[derive(Component, Copy, Clone, Debug, Default)]
pub struct Color(pub u8, pub u8, pub u8, pub u8);

impl PixelsResource {
    pub fn new(width: u32, height: u32) -> Self {
        PixelsResource {
            width,
            height,
            buffer: vec![0u8; (width * height * 4) as usize],
        }
    }

    pub fn frame(&self) -> &[u8] {
        &self.buffer
    }

    pub fn get_frame_mut(&mut self) -> &mut [u8] {
        &mut self.buffer
    }

    pub fn fill(&mut self, color: &Color) {
        self.fill_rect(0, 0, self.width as i32, self.height as i32, color, false);
    }

    pub fn fill_rect(&mut self, x: i32, y: i32, w: i32, h: i32, color: &Color, blend: bool) {
        let width = self.width as i32;
        let height = self.height as i32;

        let x_min = 0.max(x);
        let x_max = width.min(x + w);
        if x_min > x_max {
            return;
        }
        let y_min = 0.max(y);
        let y_max = height.min(y + h);
        if y_min > y_max {
            return;
        }

        if blend == true && color.3 != 0xff {
            let c = &[color.0, color.1, color.2, color.3];
            for y in y_min..y_max {
                for x in x_min..x_max {
                    self.mix_color((y * width + x) as usize * 4, c);
                }
            }
            return;
        }

        let x_offset = x_min as usize * 4;
        let x_max_offset = x_max as usize * 4;
        let line_bytes = width as usize * 4;
        let render_width = (x_max - x_min) as usize;
        let object_row = &[color.0, color.1, color.2, color.3].repeat(render_width);

        for y in y_min..y_max {
            let y_offset = y as usize * line_bytes;
            self.buffer[(x_offset + y_offset)..(x_max_offset + y_offset)]
                .copy_from_slice(object_row);
        }
    }

    pub fn mix_color(&mut self, index: usize, color: &[u8]) {
        if color[3] == 0 {
            return;
        }
        let fg_r = color[0] as f32;
        let fg_g = color[1] as f32;
        let fg_b = color[2] as f32;
        let fg_a = color[3] as f32;

        let g_idx = index + 1;
        let b_idx = index + 2;
        let a_idx = index + 3;

        let buffer = &mut self.buffer;

        let r = buffer[index] as f32;
        let g = buffer[g_idx] as f32;
        let b = buffer[b_idx] as f32;
        let bg_a = buffer[a_idx] as f32;

        let ra = 255. - (255. - fg_a) * (1. - bg_a / 255.);
        let rr = (fg_r * fg_a) / ra + (r * bg_a * (1. - fg_a / 255.)) / ra;
        let rg = (fg_g * fg_a) / ra + (g * bg_a * (1. - fg_a / 255.)) / ra;
        let rb = (fg_b * fg_a) / ra + (b * bg_a * (1. - fg_a / 255.)) / ra;
        buffer[index] = rr as u8;
        buffer[g_idx] = rg as u8;
        buffer[b_idx] = rb as u8;
        buffer[a_idx] = ra as u8;
    }

    pub fn mix_rect(&mut self, x: i32, y: i32, buffer: &[u8], width: u32) {
        let w = width as i32;
        let h = buffer.len() as i32 / w / 4;

        let width = self.width as i32;
        let height = self.height as i32;

        let x_min = 0.max(x);
        let x_max = width.min(x + w);
        if x_min > x_max {
            return;
        }
        let y_min = 0.max(y);
        let y_max = height.min(y + h);
        if y_min > y_max {
            return;
        }

        for yy in y_min..y_max {
            let y_offset = w * (yy - y) * 4;
            for xx in x_min..x_max {
                let offset = (y_offset + (xx - x) * 4) as usize;
                self.mix_color(
                    (yy * width + xx) as usize * 4,
                    &buffer[offset..(offset + 4)],
                );
            }
        }
    }
}
