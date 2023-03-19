use bevy::prelude::*;

use crate::pixels::*;

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
            .add_system(Self::clear.in_base_set(CoreSet::PostUpdate))
            .add_system(
                Self::render_rect
                    .in_base_set(CoreSet::PostUpdate)
                    .after(Self::clear),
            );
    }
}

#[derive(Component, Debug, Default)]
pub enum Visibility {
    #[default]
    Inherited,
    /// An entity with `Visibility::Hidden` will be unconditionally hidden.
    Hidden,
    /// An entity with `Visibility::Visible` will be unconditionally visible.
    ///
    /// Note that an entity with `Visibility::Visible` will be visible regardless of whether the
    /// [`Parent`] entity is hidden.
    Visible,
}

#[derive(Bundle, Debug, Default)]
pub struct SpatialBundle {
    pub transform: Transform,
    pub global_transform: GlobalTransform,
    pub visibility: Visibility,
}

#[derive(Component, Debug, Default)]
pub struct Velocity {
    pub x: f32,
    pub y: f32,
}

#[derive(Component, Debug, Default)]
pub struct Size {
    pub width: f32,
    pub height: f32,
}

#[derive(Resource, Copy, Clone, Debug, Default, Deref, DerefMut)]
pub struct ClearColor(pub Color);

impl RenderPlugin {
    pub fn clear(mut pixels_resource: ResMut<PixelsResource>, clear_color: Res<ClearColor>) {
        pixels_resource.fill(&clear_color);
    }

    pub fn render_rect(
        mut pixels_resource: ResMut<PixelsResource>,
        query: Query<(&Size, &Color, &GlobalTransform)>,
    ) {
        for (size, color, global_transform) in query.iter() {
            let global_translation = global_transform.translation();
            let x = global_translation.x as i32;
            let y = global_translation.y as i32;
            let w = size.width as i32;
            let h = size.height as i32;
            pixels_resource.fill_rect(x, y, w, h, color, true);
        }
    }
}
