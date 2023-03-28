# nesbox_utils

A utils functional for developing games for the NESBox

## Example

```rust
use nesbox_utils::prelude::*;

fn global_handle(input: Res<Input<Button>>, mut next: ResMut<NextState<AppState>>) {
    if input.just_pressed(Button::Reset) {
      log!("pressed reset button!");
    }
}

#[nesbox_bevy]
fn create_app() -> App {
    let mut app = create_bevy_app(256, 240, Color::default());

    let mut assets_resource = app.world.get_resource_mut::<AssetsResource>().unwrap();
    assets_resource.load_audio("select", decode_qoi_frame(include_bytes!("../assets/select-an-item.mp3.data")));

    app.add_state::<AppState>().add_system(global_handle);

    app
}
```
