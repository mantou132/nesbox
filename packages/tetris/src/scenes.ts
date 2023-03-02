import {
  SizeComponent,
  MaterialComponent,
  PositionComponent,
  SelectComponent,
  TextAreaComponent,
  BasicEntity,
  Scene,
  COLOR_BLACK,
  COLOR_WHITE,
  COLOR_GRAY,
} from '@mantou/ecs';

import { HEIGHT, WIDTH } from 'src/constants';
import { controlSystem, Handles } from 'src/systems';

export enum Scenes {
  Start,
  OnePlayer,
  TwoPlayer,
}

export function getScene(name: Scenes): Scene {
  switch (name) {
    case Scenes.Start:
      return new Scene(String(Scenes.Start))
        .addEntity(
          new BasicEntity('background')
            .addComponent(new MaterialComponent(COLOR_BLACK))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity('select')
            .addComponent(
              new SelectComponent([
                {
                  text: '1 Player',
                  handle: Handles.One,
                },
                {
                  text: '2 Player',
                  handle: Handles.Two,
                },
              ]),
            )
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(95, 100)),
        )
        .addSystem(controlSystem);

    case Scenes.OnePlayer:
      return new Scene(String(Scenes.OnePlayer))
        .addEntity(
          new BasicEntity('background')
            .addComponent(new MaterialComponent(COLOR_GRAY))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity('stage')
            .addComponent(new PositionComponent(0, 0))
            .addComponent(new SizeComponent(100, HEIGHT)),
        )
        .addSystem(controlSystem);

    case Scenes.TwoPlayer:
      return new Scene(String(Scenes.TwoPlayer))
        .addEntity(
          new BasicEntity('background')
            .addComponent(new MaterialComponent(COLOR_GRAY))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity('info')
            .addComponent(new PositionComponent(40, 40))
            .addComponent(
              new TextAreaComponent(
                `This part has not been completed yet. When I finish it, I shouldn't tell you for a long time, please rest assured. If you have any suggestions, you can contact me.`,
                WIDTH - 80,
              ),
            )
            .addComponent(new SizeComponent(WIDTH - 80, HEIGHT)),
        )
        .addSystem(controlSystem);
  }
}
