use nesbox_utils::prelude::*;

pub const WIDTH: u32 = 256;
pub const HEIGHT: u32 = 240;

const BOARD_ROWS: usize = 15;

const MIN_MARGIN: f32 = 15.;
const BOARD_WIDTH: f32 = HEIGHT as f32 - MIN_MARGIN * 2.;
const BOARD_LINE_WIDTH: f32 = BOARD_WIDTH / BOARD_ROWS as f32;
const MARGIN_LEFT: f32 = (WIDTH as f32 - BOARD_WIDTH) / 2.;
const MARGIN_TOP: f32 = (HEIGHT as f32 - BOARD_WIDTH) / 2.;

const LINE_COLOR: Color = Color(0, 0, 0, 0x66);

const PIECE_1_COLOR: Color = Color(0x22, 0x22, 0x22, 0xff);
const PIECE_2_COLOR: Color = Color(0xff, 0xff, 0xff, 0xff);
const PIECE_SIZE: f32 = 13.;

const CURSOR_1_COLOR: Color = Color(0, 120, 203, 0xff);
const CURSOR_2_COLOR: Color = Color(0, 0xff, 0, 0xff);
const CURSOR_SIZE: f32 = 7.;

#[derive(Resource, PartialEq, Debug, Default)]
pub enum GameMode {
    #[default]
    One,
    Two,
}

#[derive(Component, Debug, Default)]
struct Cursor1;

#[derive(Component, Debug, Default)]
struct Cursor2;

#[derive(Component, Debug, Default)]
struct CursorPosition(usize, usize);

#[derive(Component, Debug, Default)]
struct Checkerboard {
    grid: Vec<Vec<Option<Player>>>,
    current: Player,
    next: Player,
    victory: Option<Player>,
}

impl Checkerboard {
    fn new() -> Self {
        Self {
            grid: vec![vec![None; BOARD_ROWS]; BOARD_ROWS],
            current: Player::One,
            next: Player::Two,
            victory: None,
        }
    }

    fn valid(&self, x: usize, y: usize) -> bool {
        self.grid[y][x] == None
    }

    fn put(&mut self, x: usize, y: usize) -> bool {
        self.grid[y][x] = Some(self.current);

        if self.check_victory(x, y) {
            self.victory = Some(self.current);
            return true;
        }

        if self.is_full() {
            return true;
        }

        let current = self.current;
        self.current = self.next;
        self.next = current;
        return false;
    }

    fn is_full(&self) -> bool {
        for x in 0..BOARD_ROWS {
            for y in 0..BOARD_ROWS {
                if self.valid(x, y) {
                    return false;
                }
            }
        }
        true
    }

    fn get_value(&self, x: usize, y: usize) -> Option<Player> {
        self.grid.get(y).and_then(|row| row.get(x).and_then(|c| *c))
    }

    fn max_len(&self, x: usize, y: usize, dx: i32, dy: i32) -> usize {
        let mut result = 1;
        let mut xx = x as i32 + dx;
        let mut yy = y as i32 + dy;
        loop {
            if self.get_value(xx as usize, yy as usize) == Some(self.current) {
                xx += dx;
                yy += dy;
                result += 1;
            } else {
                break;
            }
        }
        result
    }

    fn check_victory(&self, x: usize, y: usize) -> bool {
        let mut max_len = 1;
        for dx in -1..=1 {
            for dy in 0..=1 {
                if dx != 0 || dy != 0 {
                    let l1 = self.max_len(x, y, dx, dy);
                    let l2 = self.max_len(x, y, -dx, -dy);
                    max_len = max_len.max(l1 + l2 - 1);
                }
            }
        }
        max_len >= 5
    }

    fn get_default(&self) -> (usize, usize) {
        let start_x = BOARD_ROWS / 2;
        let start_y = BOARD_ROWS / 2;
        if self.valid(start_x, start_y) {
            (start_x, start_y)
        } else {
            (start_x + 1, start_y + 1)
        }
    }

    fn score(&self, x: usize, y: usize) -> usize {
        // TODO: Improve
        let mut score = 0;
        for dx in -1..=1 {
            for dy in 0..=1 {
                if dx != 0 || dy != 0 {
                    let l1 = self.max_len(x, y, dx, dy);
                    let l2 = self.max_len(x, y, -dx, -dy);
                    if l1 + l2 > 2 {
                        score += 1;
                    }
                }
            }
        }
        score
    }

    fn suggestion(&self) -> (usize, usize) {
        let mut result = self.get_default();
        let mut max_score = 0;
        for x in 0..BOARD_ROWS {
            for y in 0..BOARD_ROWS {
                if self.valid(x, y) {
                    let score = self.score(x, y);
                    if score > max_score {
                        result = (x, y);
                        max_score = score;
                    }
                }
            }
        }
        result
    }
}

fn draw_cursor(parent: &mut ChildBuilder, color: Color) {
    parent.spawn((
        SpatialBundle {
            transform: Transform::from_xyz(-CURSOR_SIZE / 2. + 0.5, 0., 0.),
            ..default()
        },
        Size {
            width: CURSOR_SIZE,
            height: 1.,
        },
        color,
    ));

    parent.spawn((
        SpatialBundle {
            transform: Transform::from_xyz(0., -CURSOR_SIZE / 2. + 0.5, 0.),
            ..default()
        },
        Size {
            width: 1.,
            height: CURSOR_SIZE,
        },
        color,
    ));
}

fn setup_game(mut commands: Commands, mode: Res<GameMode>) {
    commands.insert_resource(ClearColor(Color(238, 226, 183, 0xff)));
    commands
        // stage
        .spawn(SpatialBundle {
            transform: Transform::from_xyz(MARGIN_LEFT, MARGIN_TOP, 0.),
            ..default()
        })
        .with_children(|parent| {
            parent
                .spawn((
                    Checkerboard::new(),
                    SpatialBundle {
                        transform: Transform::from_xyz(
                            BOARD_LINE_WIDTH / 2. - 1.,
                            BOARD_LINE_WIDTH / 2. - 1.,
                            0.,
                        ),
                        ..default()
                    },
                ))
                .with_children(|parent| {
                    // lines
                    for i in 0..BOARD_ROWS {
                        parent.spawn((
                            SpatialBundle {
                                transform: Transform::from_xyz(i as f32 * BOARD_LINE_WIDTH, 0., 0.),
                                ..default()
                            },
                            Size {
                                width: 1.,
                                height: BOARD_WIDTH - BOARD_LINE_WIDTH + 1.,
                            },
                            LINE_COLOR,
                        ));
                        parent.spawn((
                            SpatialBundle {
                                transform: Transform::from_xyz(0., i as f32 * BOARD_LINE_WIDTH, 0.),
                                ..default()
                            },
                            Size {
                                width: BOARD_WIDTH - BOARD_LINE_WIDTH + 1.,
                                height: 1.,
                            },
                            LINE_COLOR,
                        ));
                    }
                });
        });

    commands
        .spawn((
            Cursor1,
            CursorPosition(BOARD_ROWS / 2, BOARD_ROWS / 2),
            SpatialBundle {
                transform: Transform::from_xyz(
                    get_position(BOARD_ROWS / 2, MARGIN_LEFT),
                    get_position(BOARD_ROWS / 2, MARGIN_TOP),
                    0.,
                ),
                ..default()
            },
        ))
        .with_children(|parent| {
            draw_cursor(parent, CURSOR_1_COLOR);
        });

    if mode.into_inner() == &GameMode::Two {
        commands
            .spawn((
                Cursor2,
                CursorPosition(BOARD_ROWS / 2, BOARD_ROWS / 2),
                SpatialBundle {
                    transform: Transform::from_xyz(
                        get_position(BOARD_ROWS / 2, MARGIN_LEFT),
                        get_position(BOARD_ROWS / 2, MARGIN_TOP),
                        -1.,
                    ),
                    ..default()
                },
            ))
            .with_children(|parent| {
                draw_cursor(parent, CURSOR_2_COLOR);
            });
    }
}

fn get_grid(x: f32, offset: f32) -> usize {
    ((x - offset) / BOARD_LINE_WIDTH)
        .floor()
        .clamp(0., BOARD_ROWS as f32 - 1.) as usize
}

fn get_position(x: usize, offset: f32) -> f32 {
    x as f32 * BOARD_LINE_WIDTH + offset + BOARD_LINE_WIDTH / 2. - 1.0
}

fn mouse_motion(
    mut mouse_evt: EventReader<MouseEvent>,
    mut set: ParamSet<(
        Query<(&mut Transform, &mut CursorPosition), With<Cursor1>>,
        Query<(&mut Transform, &mut CursorPosition), With<Cursor2>>,
    )>,
    board_query: Query<&Checkerboard>,
    mut audio_resource: ResMut<AudioResource>,
) {
    if let Some(event) = mouse_evt.iter().last() {
        let checkerboard = board_query.single();
        if checkerboard.current != event.player {
            return;
        }

        let mut change = |mut transform: Mut<Transform>, mut cursor: Mut<CursorPosition>| {
            let x = get_grid(event.position.x, MARGIN_LEFT);
            let y = get_grid(event.position.y, MARGIN_TOP);

            if x != cursor.0 || y != cursor.1 {
                cursor.0 = x;
                cursor.1 = y;
                transform.translation.x = get_position(cursor.0, MARGIN_LEFT);
                transform.translation.y = get_position(cursor.1, MARGIN_TOP);
                audio_resource.play("move_cursor");
            }
        };

        if checkerboard.current == Player::One {
            let mut query = set.p0();
            let (transform, cursor) = query.single_mut();
            change(transform, cursor);
        } else {
            let mut query = set.p1();
            if let Ok((transform, cursor)) = query.get_single_mut() {
                change(transform, cursor);
            }
        }
    }
}

fn handle_dir(
    input: Res<Input<Button>>,
    mut set: ParamSet<(
        Query<(&mut Transform, &mut CursorPosition), With<Cursor1>>,
        Query<(&mut Transform, &mut CursorPosition), With<Cursor2>>,
    )>,
    board_query: Query<&Checkerboard>,
    mut audio_resource: ResMut<AudioResource>,
) {
    let mut change = |mut transform: Mut<Transform>,
                      mut cursor: Mut<CursorPosition>,
                      left: Button,
                      right: Button,
                      up: Button,
                      down: Button| {
        let mut pressed = false;
        if input.just_pressed(left) {
            cursor.0 = cursor.0.max(1) - 1;
            pressed = true;
        }

        if input.just_pressed(right) {
            cursor.0 = cursor.0.min(BOARD_ROWS - 2) + 1;
            pressed = true;
        }

        if input.just_pressed(up) {
            cursor.1 = cursor.1.max(1) - 1;
            pressed = true;
        }

        if input.just_pressed(down) {
            cursor.1 = cursor.1.min(BOARD_ROWS - 2) + 1;
            pressed = true;
        }

        if pressed {
            audio_resource.play("move_cursor");
            transform.translation.x = get_position(cursor.0, MARGIN_LEFT);
            transform.translation.y = get_position(cursor.1, MARGIN_TOP);
        }
    };

    let checkerboard = board_query.single();
    if checkerboard.current == Player::One {
        let mut query = set.p0();
        let (transform, cursor) = query.single_mut();
        change(
            transform,
            cursor,
            Button::Joypad1Left,
            Button::Joypad1Right,
            Button::Joypad1Up,
            Button::Joypad1Down,
        );
    } else {
        let mut query = set.p1();
        if let Ok((transform, cursor)) = query.get_single_mut() {
            change(
                transform,
                cursor,
                Button::Joypad2Left,
                Button::Joypad2Right,
                Button::Joypad2Up,
                Button::Joypad2Down,
            );
        }
    }
}

fn get_piece_color(player: Player) -> Color {
    match player {
        Player::One => PIECE_1_COLOR,
        _ => PIECE_2_COLOR,
    }
}

fn spawn_piece(commands: &mut Commands, x: usize, y: usize, color: Color) -> Entity {
    commands
        .spawn((
            SpatialBundle {
                transform: Transform::from_xyz(
                    BOARD_LINE_WIDTH * x as f32 - PIECE_SIZE / 2. + 0.5,
                    BOARD_LINE_WIDTH * y as f32 - PIECE_SIZE / 2. + 0.5,
                    0.,
                ),
                ..default()
            },
            Sprite("piece".into()),
            color,
        ))
        .id()
}

fn handle_submit(
    mut commands: Commands,
    input: Res<Input<Button>>,
    mut set: ParamSet<(
        Query<(&CursorPosition, &mut Transform), With<Cursor1>>,
        Query<(&CursorPosition, &mut Transform), With<Cursor2>>,
    )>,
    mut board_query: Query<(Entity, &mut Checkerboard)>,
    mut next: ResMut<NextState<AppState>>,
    mut audio_resource: ResMut<AudioResource>,
) {
    let (board_entity, mut checkerboard) = board_query.single_mut();

    let (x, y) = if checkerboard.current == Player::One {
        let mut query = set.p0();
        let (cursor1, mut transform) = query.single_mut();
        transform.translation.z = 1.;
        if !input.any_just_pressed([Button::Joypad1A, Button::Joypad1B, Button::Pointer1Left]) {
            return;
        }
        transform.translation.z = -1.;
        (cursor1.0, cursor1.1)
    } else {
        let mut query2 = set.p1();
        let cursor2_result = query2.get_single_mut();

        if cursor2_result.is_err() {
            // p2 auto
            let (x, y) = checkerboard.suggestion();
            let piece = spawn_piece(&mut commands, x, y, get_piece_color(checkerboard.current));
            commands.entity(board_entity).add_child(piece);

            let is_over = checkerboard.put(x, y);
            audio_resource.play("put_piece");
            if is_over {
                next.set(AppState::GameOver);
            }
            return;
        };
        let (cursor2, mut transform) = cursor2_result.unwrap();
        transform.translation.z = 1.;
        if !input.any_just_pressed([Button::Joypad2A, Button::Joypad2B, Button::Pointer2Left]) {
            return;
        }
        transform.translation.z = -1.;
        (cursor2.0, cursor2.1)
    };

    if !checkerboard.valid(x, y) {
        return;
    }

    let piece = spawn_piece(&mut commands, x, y, get_piece_color(checkerboard.current));
    commands.entity(board_entity).add_child(piece);

    let is_over = checkerboard.put(x, y);
    audio_resource.play("put_piece");
    if is_over {
        next.set(AppState::GameOver);
    }
}

#[derive(Debug, Clone, Copy, Default, Eq, PartialEq, Hash, States)]
pub enum AppState {
    #[default]
    Menu,
    InGame,
    GameOver,
    Paused,
    About,
}

const SELECT_OPTIONS: &[&str] = &["1 Player", "2 Player", "", "About"];

fn setup_menu(mut commands: Commands) {
    commands.insert_resource(ClearColor(Color(0xff, 0xff, 0xff, 0xff)));
    commands.spawn((
        SpatialBundle {
            transform: Transform::from_xyz(0., 50., 0.),
            ..default()
        },
        UITextArea {
            value: "五子棋".into(),
            font: "arial_black".into(),
            width: WIDTH as f32,
            center: true,
        },
        Color(0x0, 0x0, 0x0, 0xff),
    ));
    commands.spawn((
        SpatialBundle {
            transform: Transform::from_xyz(WIDTH as f32 / 2. - 43., WIDTH as f32 / 2. - 20., 0.),
            ..default()
        },
        UISelect {
            options: SELECT_OPTIONS.iter().map(|v| v.to_string()).collect(),
            ..default()
        },
        Color(0x0, 0x0, 0x0, 0xff),
    ));
}

fn select(
    mut commands: Commands,
    input: Res<Input<Button>>,
    mut audio_resource: ResMut<AudioResource>,
    mut next: ResMut<NextState<AppState>>,
    mut query: Query<&mut UISelect>,
) {
    let mut select = query.single_mut();
    let sound = Audio {
        name: "select".into(),
        volume: 20,
        ..default()
    };

    if input.just_pressed(Button::Joypad1Up) {
        select.change(-1);
        audio_resource.play_audio(sound);
    } else if input.any_just_pressed([Button::Joypad1Down, Button::Select]) {
        select.change(1);
        audio_resource.play_audio(sound);
    }

    let select_mode = select.value();
    if input.any_just_pressed([Button::Start, Button::Joypad1A, Button::Joypad1B]) {
        if select_mode == SELECT_OPTIONS[0] {
            commands.insert_resource(GameMode::One);
            next.set(AppState::InGame);
        }
        if select_mode == SELECT_OPTIONS[1] {
            commands.insert_resource(GameMode::Two);
            next.set(AppState::InGame);
        }
        if select_mode == SELECT_OPTIONS[3] {
            next.set(AppState::About);
        }
    }
}

fn setup_game_over(mut commands: Commands, board_query: Query<&Checkerboard>) {
    let board = board_query.single();
    let frame_width = 150.;
    let frame_height = 120.;
    commands
        .spawn((
            SpatialBundle {
                transform: Transform::from_xyz(
                    (WIDTH as f32 - frame_width) / 2.,
                    (HEIGHT as f32 - frame_height) / 2.,
                    0.,
                ),
                ..default()
            },
            Size {
                width: frame_width,
                height: frame_height,
            },
            Color(255, 255, 255, 180),
        ))
        .with_children(|parent| {
            parent.spawn((
                SpatialBundle {
                    transform: Transform::from_xyz(2., 2., 1.),
                    ..default()
                },
                Size {
                    width: frame_width - 4.,
                    height: frame_height - 4.,
                },
                Color(0, 0, 0, 180),
            ));
            parent.spawn((
                SpatialBundle {
                    transform: Transform::from_xyz(0., 30., 0.),
                    ..default()
                },
                UITextArea {
                    value: "GAME OVER!".into(),
                    font: "arial_black".into(),
                    width: frame_width,
                    center: true,
                },
                Color(255, 255, 255, 255),
            ));
            for _ in 0..2 {
                parent.spawn((
                    SpatialBundle {
                        transform: Transform::from_xyz(0., 70., 0.),
                        ..default()
                    },
                    UITextArea {
                        value: if let Some(player) = board.victory {
                            match player {
                                Player::One => "1P wins!".into(),
                                _ => "2P wins!".into(),
                            }
                        } else {
                            "No one wins!".into()
                        },
                        width: frame_width,
                        center: true,
                        ..default()
                    },
                    if let Some(player) = board.victory {
                        match player {
                            Player::One => CURSOR_1_COLOR,
                            _ => CURSOR_2_COLOR,
                        }
                    } else {
                        Color(255, 255, 255, 255)
                    },
                ));
            }
        });
}

fn handle_game_over(input: Res<Input<Button>>, mut next: ResMut<NextState<AppState>>) {
    if input.any_just_pressed([Button::Joypad1A, Button::Joypad1B, Button::Pointer1Left]) {
        next.set(AppState::InGame);
    }
}

fn setup_about(mut commands: Commands) {
    commands.insert_resource(ClearColor(Color(0x33, 0x33, 0x33, 0xff)));
    commands.spawn((
        SpatialBundle {
            transform: Transform::from_xyz(MARGIN_LEFT * 2., MARGIN_TOP * 2., 0.),
            ..default()
        },
        UITextArea {
            value: include_str!("../assets/about.txt").to_string(),
            width: BOARD_WIDTH - MARGIN_LEFT * 2.,
            ..default()
        },
        Color(0xff, 0xff, 0xff, 0xff),
    ));
}

fn handle_about(input: Res<Input<Button>>, mut next: ResMut<NextState<AppState>>) {
    if input.any_just_pressed([Button::Joypad1A, Button::Joypad1B, Button::Pointer1Left]) {
        next.set(AppState::Menu);
    }
}

fn despawn_screen(to_despawn: Query<Entity>, mut commands: Commands) {
    for entity in &to_despawn {
        commands.entity(entity).despawn_recursive();
    }
}

pub fn create_app() -> App {
    let mut app = create_bevy_app(WIDTH, HEIGHT, Color::default());

    let mut assets_resource = app.world.get_resource_mut::<AssetsResource>().unwrap();

    assets_resource.load_font(
        "",
        decode_qoi_frame(include_bytes!("../assets/courierNew.data")),
    );

    assets_resource.load_sprite(
        "piece",
        (13, decode_qoi_frame(include_bytes!("../assets/piece.data"))),
    );

    assets_resource.load_font(
        "arial_black",
        decode_qoi_frame(include_bytes!("../assets/arialBlack.data")),
    );

    let sound = decode_qoi_frame(include_bytes!("../assets/select-an-item.mp3.data"));

    assets_resource.load_audio("select", sound);
    assets_resource.load_audio_from("put_piece", "select", (0.3, 0.5));
    assets_resource.load_audio_from("move_cursor", "select", (0.5, 0.58));

    // no `run()`: https://github.com/just-talks/game-dev/discussions/2
    app.add_state::<AppState>()
        .add_systems(
            (despawn_screen, setup_menu.after(despawn_screen)).in_schedule(OnEnter(AppState::Menu)),
        )
        .add_system(select.in_set(OnUpdate(AppState::Menu)))
        .add_systems(
            (despawn_screen, setup_game.after(despawn_screen))
                .in_schedule(OnEnter(AppState::InGame)),
        )
        .add_systems(
            (
                mouse_motion,
                handle_dir,
                handle_submit.after(handle_dir).after(mouse_motion),
            )
                .in_set(OnUpdate(AppState::InGame)),
        )
        .add_system(setup_game_over.in_schedule(OnEnter(AppState::GameOver)))
        .add_system(handle_game_over.in_set(OnUpdate(AppState::GameOver)))
        .add_systems(
            (despawn_screen, setup_about.after(despawn_screen))
                .in_schedule(OnEnter(AppState::About)),
        )
        .add_system(handle_about.in_set(OnUpdate(AppState::About)));

    app
}
