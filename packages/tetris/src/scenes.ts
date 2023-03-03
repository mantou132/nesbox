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
  COLOR_RED,
} from '@mantou/ecs';
import { PieceEntity } from 'src/entities';
import { PieceComponent } from 'src/components';

import {
  HEIGHT,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WIDTH,
  SCENES,
  ENTITIES,
  HANDLES,
  STAGE_MARGIN_LEFT,
  STAGE_MARGIN_BLOCK,
  SIDE_WIDTH,
  BRICK_SIZE,
} from 'src/constants';
import { commonSystem, moveSystem, modeSelectSystem, pauseSystem, scoreSystem } from 'src/systems';

export function getScene(name: SCENES): Scene {
  switch (name) {
    case SCENES.Start:
      return new Scene(SCENES.Start)
        .addEntity(
          new BasicEntity(ENTITIES.Background)
            .addComponent(new MaterialComponent(COLOR_BLACK))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity()
            .addComponent(new PositionComponent(95, 100))
            .addComponent(new MaterialComponent(COLOR_BLACK))
            .addEntity(
              new BasicEntity(ENTITIES.ModeSelect).addComponent(new MaterialComponent(COLOR_WHITE)).addComponent(
                new SelectComponent([
                  {
                    text: '1 Player',
                    handle: HANDLES.OneMode,
                  },
                  {
                    text: '2 Player',
                    handle: HANDLES.TwoMode,
                  },
                ]),
              ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(modeSelectSystem);

    case SCENES.OnePlayer:
      return new Scene(SCENES.OnePlayer)
        .addEntity(
          new BasicEntity(ENTITIES.Background)
            .addComponent(new MaterialComponent(COLOR_GRAY))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITIES.Stage)
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(STAGE_WIDTH, STAGE_HEIGHT))
            .addEntity(new PieceEntity(PieceComponent.randomType(), ENTITIES.CurrentPiece1).transformX()),
        )
        .addEntity(
          new BasicEntity(ENTITIES.Side)
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT + STAGE_WIDTH, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(SIDE_WIDTH, STAGE_HEIGHT))
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(COLOR_WHITE))
                .addComponent(new PositionComponent((SIDE_WIDTH - BRICK_SIZE * 4) / 2, 0))
                .addComponent(new SizeComponent(SIDE_WIDTH, 40))
                .addEntity(
                  new BasicEntity()
                    .addComponent(new PositionComponent(10, 10))
                    .addComponent(new MaterialComponent(COLOR_RED))
                    .addComponent(new TextAreaComponent('SCORE:')),
                )
                .addEntity(
                  new BasicEntity(ENTITIES.Score)
                    .addComponent(new PositionComponent(10, 20))
                    .addComponent(new TextAreaComponent('0')),
                ),
            )
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(COLOR_WHITE))
                .addComponent(new PositionComponent((SIDE_WIDTH - BRICK_SIZE * 4) / 2, 50))
                .addComponent(new SizeComponent(SIDE_WIDTH, 40 + BRICK_SIZE * 2))
                .addEntity(
                  new BasicEntity()
                    .addComponent(new PositionComponent(10, 10))
                    .addComponent(new MaterialComponent(COLOR_RED))
                    .addComponent(new TextAreaComponent('NEXT:')),
                )
                .addEntity(
                  new BasicEntity(ENTITIES.NextStage)
                    .addComponent(new PositionComponent(10, 30))
                    .addEntity(new PieceEntity(PieceComponent.randomType())),
                ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(pauseSystem)
        .addSystem(moveSystem)
        .addSystem(scoreSystem);

    case SCENES.TwoPlayer:
      return new Scene(SCENES.TwoPlayer)
        .addEntity(
          new BasicEntity(ENTITIES.Background)
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITIES.UnImplementInfo)
            .addComponent(new PositionComponent(40, 40))
            .addComponent(new SizeComponent(WIDTH - 80, HEIGHT - 80))
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(COLOR_GRAY))
                .addComponent(
                  new TextAreaComponent(
                    `This part has not been completed yet. \n\nWhen I finish it, I shouldn't tell you for a long time, please rest assured.\n\nIf you have any suggestions, you can contact me.`,
                    WIDTH - 80,
                  ),
                ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(pauseSystem)
        .addSystem(moveSystem);
  }
}
