use bevy::prelude::*;

use crate::{assets::AssetsResource, pixels::*, prelude::MouseEvent};

#[derive(Debug, Default)]
pub struct RenderPlugin {
    pub width: u32,
    pub height: u32,
    pub clear_color: Color,
}

impl Plugin for RenderPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(PixelsResource::new(self.width, self.height))
            .insert_resource(ClearColor(self.clear_color))
            .add_system(Self::clear.in_base_set(CoreSet::Last))
            .add_system(
                Self::render_rect
                    .in_base_set(CoreSet::Last)
                    .after(Self::clear),
            )
            .add_system(
                Self::render_select
                    .in_base_set(CoreSet::Last)
                    .after(Self::render_rect),
            )
            .add_system(
                Self::render_textarea
                    .in_base_set(CoreSet::Last)
                    .after(Self::render_rect),
            );
    }
}

#[derive(Bundle, Debug, Default)]
pub struct SpatialBundle {
    pub transform: Transform,
    pub global_transform: GlobalTransform,
}

#[derive(Component, Debug, Default)]
pub struct Size {
    pub width: f32,
    pub height: f32,
}

#[derive(Component, Debug, Default)]
pub struct Sprite(pub String);

#[derive(Resource, Copy, Clone, Debug, Default, Deref, DerefMut)]
pub struct ClearColor(pub Color);

#[derive(Component, Debug)]
pub struct UISelect {
    pub options: Vec<String>,
    pub selected: usize,
    pub font: String,
    pub line_height: f32,
    pub positions: Vec<(f32, f32, f32, f32)>,
}

impl Default for UISelect {
    fn default() -> Self {
        Self {
            options: Vec::from(["Option 1".into(), "Option 2".into()]),
            selected: 0,
            font: String::new(),
            line_height: 1.5,
            positions: Vec::new(),
        }
    }
}

impl UISelect {
    pub fn change(&mut self, step: i32) {
        let len = self.options.len();
        self.selected = (len as i32 + self.selected as i32 + step) as usize % len;
        if self.options[self.selected].is_empty() {
            self.change(step);
        }
    }

    pub fn value(&self) -> &str {
        &self.options[self.selected]
    }

    pub fn is_enter_hover(&mut self, event: Option<&MouseEvent>) -> (bool, bool) {
        if let Some(evt) = event {
            if let Some(index) = self.positions.iter().position(|&(x, y, w, h)| {
                evt.position.x > x
                    && evt.position.y > y
                    && evt.position.x < x + w
                    && evt.position.y < y + h
            }) {
                if self.selected != index {
                    self.selected = index;
                    return (true, true);
                } else {
                    return (false, true);
                }
            }
        }
        (false, false)
    }
}

#[derive(Component, Debug, Default)]
pub struct UITextArea {
    pub value: String,
    pub width: f32,
    pub font: String,
    pub center: bool,
}

impl RenderPlugin {
    fn clear(mut pixels_resource: ResMut<PixelsResource>, clear_color: Res<ClearColor>) {
        pixels_resource.fill(&clear_color);
    }

    fn render_rect(
        assets_resource: Res<AssetsResource>,
        mut pixels_resource: ResMut<PixelsResource>,
        query: Query<(
            &GlobalTransform,
            Option<&Size>,
            Option<&Color>,
            Option<&Sprite>,
        )>,
    ) {
        let iter = query.iter().map(|(global_transform, size, color, sprite)| {
            (global_transform.translation(), size, color, sprite)
        });
        let mut vec: Vec<(Vec3, Option<&Size>, Option<&Color>, Option<&Sprite>)> = iter.collect();
        vec.sort_by(|a, b| {
            a.0.z
                .partial_cmp(&b.0.z)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        for (global_translation, size, color, sprite) in vec {
            if global_translation.z < 0. {
                continue;
            }
            if let Some(sprite) = sprite {
                let (width, buffer) = assets_resource.get_sprite(&sprite.0).unwrap();
                pixels_resource.mix_rect(
                    global_translation.x as i32,
                    global_translation.y as i32,
                    buffer,
                    *width,
                    color,
                )
            } else if let Some(size) = size {
                pixels_resource.fill_rect(
                    global_translation.x as i32,
                    global_translation.y as i32,
                    size.width as i32,
                    size.height as i32,
                    color,
                    true,
                );
            }
        }
    }

    fn render_select(
        mut pixels_resource: ResMut<PixelsResource>,
        assets_resource: Res<AssetsResource>,
        mut query: Query<(&mut UISelect, &GlobalTransform, Option<&Color>)>,
    ) {
        for (mut select, global_transform, color) in query.iter_mut() {
            let global_translation = global_transform.translation();
            if global_translation.z < 0. {
                continue;
            }
            let (font_size, font_chars) = assets_resource.get_font(&select.font);
            let default_char_width = *font_size as i32 / 2;
            let line_height = select.line_height * *font_size;
            let mut positions = Vec::with_capacity(select.options.len());

            for (index, option) in select.options.iter().enumerate() {
                let mut x = global_translation.x;
                let y = global_translation.y + index as f32 * line_height;
                if index == select.selected {
                    pixels_resource.fill_rect(
                        (x + *font_size / 4.) as i32,
                        (y + *font_size / 4.) as i32,
                        (*font_size / 2.) as i32,
                        (*font_size / 2.) as i32,
                        color,
                        false,
                    );
                }
                x += 2. * font_size;
                for char in option.chars() {
                    if let Some((width, buffer)) = font_chars.get(&char) {
                        pixels_resource.mix_rect(x as i32, y as i32, buffer, *width, color);
                        x += *width as f32;
                    } else {
                        pixels_resource.fill_rect(
                            x as i32,
                            y as i32,
                            default_char_width,
                            *font_size as i32,
                            color,
                            false,
                        );
                        x += default_char_width as f32;
                    }
                }
                positions.push((
                    global_translation.x,
                    y,
                    x - global_translation.x,
                    line_height,
                ));
            }
            select.positions = positions;
        }
    }

    fn render_textarea(
        mut pixels_resource: ResMut<PixelsResource>,
        assets_resource: Res<AssetsResource>,
        query: Query<(&UITextArea, &GlobalTransform, Option<&Color>)>,
    ) {
        for (textarea, global_transform, color) in query.iter() {
            let global_translation = global_transform.translation();
            if global_translation.z < 0. {
                continue;
            }
            let (font_size, font_chars) = assets_resource.get_font(&textarea.font);
            let default_char_width = *font_size as i32 / 2;
            let line_height = 1.2 * *font_size;
            let mut x = global_translation.x;
            let mut y = global_translation.y;
            let x_max = global_translation.x + textarea.width;

            if textarea.center {
                let mut total_len = 0.;
                for char in textarea.value.chars() {
                    if let Some((width, _)) = font_chars.get(&char) {
                        total_len += *width as f32;
                    } else {
                        total_len += default_char_width as f32;
                    }
                }
                x += (textarea.width - total_len) / 2.;
            }

            for char in textarea.value.chars() {
                match char {
                    '\r' => continue,
                    '\n' => {
                        x = global_translation.x;
                        y += line_height;
                    }
                    _ => {
                        if let Some((width, buffer)) = font_chars.get(&char) {
                            if *width as f32 + x > x_max {
                                x = global_translation.x;
                                y += line_height;
                            }
                            pixels_resource.mix_rect(x as i32, y as i32, buffer, *width, color);
                            x += *width as f32;
                        } else {
                            if default_char_width as f32 + x > x_max {
                                x = global_translation.x;
                                y += line_height;
                            }
                            pixels_resource.fill_rect(
                                x as i32,
                                y as i32,
                                default_char_width,
                                *font_size as i32,
                                color,
                                false,
                            );
                            x += default_char_width as f32;
                        }
                    }
                }
            }
        }
    }
}
