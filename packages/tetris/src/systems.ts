import { SelectComponent, Entity, World, AudioComponent } from '@mantou/ecs';

import { getScene, Scenes } from 'src/scenes';

export function moveSystem(_world: World) {
  //
}

export function collisionSystem(_world: World) {
  //
}

export enum Handles {
  One,
  Two,
}

let preControl = {} as typeof nesbox.control;
export function controlSystem(world: World) {
  const handleEntity = (entity: Entity) => {
    switch (world.scene) {
      case String(Scenes.Start): {
        const select = entity.getComponent(SelectComponent);
        if (select) {
          if (!preControl[nesbox.buttons.Joypad1Up] && nesbox.control[nesbox.buttons.Joypad1Up]) {
            select.change(-1);
            world.addAudio(new AudioComponent('selectAnItem'));
          }
          if (!preControl[nesbox.buttons.Joypad1Down] && nesbox.control[nesbox.buttons.Joypad1Down]) {
            select.change(1);
            world.addAudio(new AudioComponent('selectAnItem'));
          }
          if (nesbox.control[nesbox.buttons.Start]) {
            switch (select.getHandle()) {
              case Handles.One:
                world.switchScene(getScene(Scenes.OnePlayer));
                break;
              case Handles.Two:
                world.switchScene(getScene(Scenes.TwoPlayer));
                break;
            }
          }
        }
        break;
      }

      case String(Scenes.OnePlayer): {
        break;
      }

      case String(Scenes.TwoPlayer): {
        break;
      }
    }

    entity.getEntities().forEach((entity) => handleEntity(entity));
  };
  world.getEntities().forEach((entity) => handleEntity(entity));
  preControl = { ...nesbox.control };
}
