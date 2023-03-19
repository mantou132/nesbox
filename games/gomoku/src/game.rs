use nesbox_utils::{input::*, prelude::*, render::*};

pub const RENDER_WIDTH: u32 = 256;
pub const RENDER_HEIGHT: u32 = 240;
pub const RENDER_PIXELS: usize = (RENDER_WIDTH * RENDER_HEIGHT) as usize;
pub const RENDER_SIZE: usize = 4 * RENDER_PIXELS;

const OBJ_SIZE: f32 = 64.;

#[derive(Component, Debug, Default)]
struct Player;

#[derive(Component, Debug, Default)]
struct Cursor;

fn setup(mut commands: Commands) {
    commands
        .spawn((
            Player,
            Velocity { x: 1., y: 1. },
            SpatialBundle {
                transform: Transform::from_xyz(1., 1., 0.),
                ..default()
            },
        ))
        .with_children(|parent| {
            for i in 0..2 {
                for j in 0..2 {
                    parent.spawn((
                        SpatialBundle {
                            transform: Transform::from_xyz(
                                i as f32 * OBJ_SIZE / 2.,
                                j as f32 * OBJ_SIZE / 2.,
                                0.,
                            ),
                            ..default()
                        },
                        Size {
                            width: OBJ_SIZE / 2.,
                            height: OBJ_SIZE / 2.,
                        },
                        Color(random(), random(), random(), 0xff),
                    ));
                }
            }
        });
    commands.spawn((
        SpatialBundle {
            transform: Transform::from_xyz(0., 0., 0.),
            ..default()
        },
        Cursor,
        Size {
            width: 4.,
            height: 4.,
        },
        Color(0xff, 0x00, 0x00, 0x66),
    ));
}

fn bounce(
    mut query: Query<(&Transform, &mut Velocity, &Children), With<Player>>,
    mut q_child: Query<&mut Color>,
) {
    let mut bounce = false;
    let (transform, mut velocity, children) = query.single_mut();
    let Vec3 { x, y, .. } = transform.translation;

    if x < 0. || x + OBJ_SIZE > RENDER_WIDTH as f32 {
        velocity.x *= -1.;
        bounce = true;
    }
    if y < 0. || y + OBJ_SIZE > RENDER_HEIGHT as f32 {
        velocity.y *= -1.;
        bounce = true;
    }

    if bounce {
        for &child in children.iter() {
            let mut color = q_child.get_mut(child).unwrap();
            color.0 = random();
            color.1 = random();
            color.2 = random();
        }
    }
}

fn handle(input: Res<Input<Button>>, mut query: Query<&mut Velocity, With<Player>>) {
    let mut velocity = query.single_mut();

    if input.just_pressed(Button::Joypad1Left) {
        velocity.x = velocity.x.abs() * -1.;
    }

    if input.just_pressed(Button::Joypad1Right) {
        velocity.x = velocity.x.abs();
    }

    if input.just_pressed(Button::Joypad1Up) {
        velocity.y = velocity.y.abs() * -1.;
    }

    if input.just_pressed(Button::Joypad1Down) {
        velocity.y = velocity.y.abs();
    }
}

fn movement(mut query: Query<(&mut Transform, &Velocity), With<Player>>) {
    for (mut transform, velocity) in query.iter_mut() {
        transform.translation.x += velocity.x;
        transform.translation.y += velocity.y;
    }
}

fn mouse_motion(
    mut mouse_evt: EventReader<MouseEvent>,
    mut query: Query<(&Cursor, &mut Transform)>,
) {
    if let Some(event) = mouse_evt.iter().last() {
        if let Some((_, mut transform)) = query.iter_mut().last() {
            transform.translation.x = event.delta.x - 2.;
            transform.translation.y = event.delta.y - 2.;
        }
    }
}

pub fn create_app() -> App {
    let mut app = create_bevy_app(RENDER_WIDTH, RENDER_HEIGHT, Color(0x48, 0xb2, 0xe8, 0xff));

    app.add_startup_system(setup)
        .add_system(bounce)
        .add_system(movement.after(bounce))
        .add_system(mouse_motion)
        .add_system(handle);

    app
}
