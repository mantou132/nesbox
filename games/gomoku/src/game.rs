use nesbox_utils::{bevy_app::*, bevy_ecs::prelude::*, input::*, prelude::*, render::*};

pub const RENDER_WIDTH: u32 = 256;
pub const RENDER_HEIGHT: u32 = 240;
pub const RENDER_PIXELS: usize = (RENDER_WIDTH * RENDER_HEIGHT) as usize;
pub const RENDER_SIZE: usize = 4 * RENDER_PIXELS;

#[derive(Bundle, Debug)]
struct ObjectBundle {
    position: Position,
    velocity: Velocity,
    size: Size,
    color: Color,
}

#[derive(Bundle, Debug)]
struct BgBundle {
    position: Position,
    size: Size,
    color: Color,
}

#[derive(Component)]
struct Cursor;

fn setup(mut commands: Commands) {
    let bg = BgBundle {
        position: Position { x: 0, y: 0 },
        size: Size {
            width: RENDER_WIDTH,
            height: RENDER_HEIGHT,
        },
        color: Color(0x48, 0xb2, 0xe8, 0xff),
    };
    commands.spawn(bg);
    let box_object = ObjectBundle {
        position: Position { x: 24, y: 16 },
        velocity: Velocity { x: 1, y: 1 },
        size: Size {
            width: 64,
            height: 64,
        },
        color: Color(0x5e, 0x48, 0xe8, 0xff),
    };
    commands.spawn(box_object);
    commands.spawn((
        Cursor,
        Position { x: -2, y: -2 },
        Size {
            width: 4,
            height: 4,
        },
        Color(0x00, 0x00, 0x00, 0xff),
    ));
}

fn bounce(mut query: Query<(&Position, &mut Velocity, &Size, &mut Color)>) {
    for (position, mut velocity, size, mut color) in query.iter_mut() {
        let mut bounce = false;
        if position.x == 0 || position.x + size.width as i32 > RENDER_WIDTH as i32 {
            velocity.x *= -1;
            bounce = true;
        }
        if position.y == 0 || position.y + size.height as i32 > RENDER_HEIGHT as i32 {
            velocity.y *= -1;
            bounce = true;
        }
        if bounce {
            color.0 = random();
            color.1 = random();
            color.2 = random();
        }
    }
}

fn handle(input: Res<Input<Button>>, mut query: Query<&mut Velocity>) {
    let mut velocity = query.single_mut();

    if input.just_pressed(Button::Joypad1Left) {
        velocity.x = velocity.x.abs() * -1;
    }

    if input.just_pressed(Button::Joypad1Right) {
        velocity.x = velocity.x.abs();
    }

    if input.just_pressed(Button::Joypad1Up) {
        velocity.y = velocity.y.abs() * -1;
    }

    if input.just_pressed(Button::Joypad1Down) {
        velocity.y = velocity.y.abs();
    }
}

fn movement(mut query: Query<(&mut Position, &Velocity)>) {
    for (mut position, velocity) in query.iter_mut() {
        position.x = position.x + velocity.x;
        position.y = position.y + velocity.y;
    }
}

fn mouse_motion(
    mut mouse_evt: EventReader<MouseEvent>,
    mut query: Query<(&Cursor, &mut Position)>,
) {
    if let Some(event) = mouse_evt.iter().last() {
        if let Some((_, mut position)) = query.iter_mut().last() {
            position.x = event.delta.x as i32 - 2;
            position.y = event.delta.y as i32 - 2;
        }
    }
}

pub fn create_app() -> App {
    let mut app = create_bevy_app(RENDER_WIDTH, RENDER_HEIGHT);

    app.add_startup_system(setup)
        .add_system(bounce)
        .add_system(mouse_motion)
        .add_system(handle)
        .add_system(movement.after(bounce));

    app
}
