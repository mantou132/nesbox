import {
  SizeComponent,
  MaterialComponent,
  PositionComponent,
  SelectComponent,
  TextAreaComponent,
  BasicEntity,
  Scene,
  COLOR_WHITE,
  COLOR_GRAY,
} from '@mantou/ecs';
import { PieceEntity } from 'src/entities';
import { PieceComponent } from 'src/components';

import {
  HEIGHT,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WIDTH,
  SCENE_LABEL,
  ENTITY_LABEL,
  SELECT_HANDLE,
  STAGE_MARGIN_LEFT,
  STAGE_MARGIN_BLOCK,
  SIDE_WIDTH,
  BRICK_SIZE,
  BACKGROUND_COLOR,
  STAGE_BACKGROUND_COLOR,
  SCORE_COLOR,
} from 'src/constants';
import { commonSystem, moveSystem, modeSelectSystem, pauseSystem, scoreSystem } from 'src/systems';

export function getScene(name: SCENE_LABEL): Scene {
  switch (name) {
    case SCENE_LABEL.Start:
      return new Scene(SCENE_LABEL.Start)
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(
              new TextAreaComponent('TETRIS', {
                width: WIDTH,
                fontType: 'heading',
                center: true,
              }),
            )
            .addComponent(new PositionComponent(0, 70)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(WIDTH / 2 - 30, 90))
            .addComponent(new SizeComponent(61, 3)),
        )
        .addEntity(
          new BasicEntity()
            .addComponent(new PositionComponent(90, 120))
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addEntity(
              new BasicEntity(ENTITY_LABEL.ModeSelect).addComponent(new MaterialComponent(COLOR_WHITE)).addComponent(
                new SelectComponent([
                  {
                    text: '1 Player',
                    handle: SELECT_HANDLE.OneMode,
                  },
                  {
                    text: '2 Player',
                    handle: SELECT_HANDLE.TwoMode,
                  },
                  {
                    text: '',
                    handle: '',
                  },
                  {
                    text: 'About',
                    handle: SELECT_HANDLE.About,
                  },
                ]),
              ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(modeSelectSystem);

    case SCENE_LABEL.OnePlayer:
      return new Scene(SCENE_LABEL.OnePlayer)
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT - 1, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(1, STAGE_HEIGHT)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Stage)
            .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(STAGE_WIDTH, STAGE_HEIGHT))
            .addEntity(new PieceEntity(PieceComponent.randomType(), ENTITY_LABEL.CurrentPiece1).transformX()),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Side)
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT + STAGE_WIDTH, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(SIDE_WIDTH, STAGE_HEIGHT))
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
                .addComponent(new PositionComponent((SIDE_WIDTH - BRICK_SIZE * 4) / 2, 0))
                .addComponent(new SizeComponent(SIDE_WIDTH, 40))
                .addEntity(
                  new BasicEntity()
                    .addComponent(new PositionComponent(10, 10))
                    .addComponent(new MaterialComponent(COLOR_WHITE))
                    .addComponent(new TextAreaComponent('SCORE:')),
                )
                .addEntity(
                  new BasicEntity(ENTITY_LABEL.Score)
                    .addComponent(new PositionComponent(10, 20))
                    .addComponent(new MaterialComponent(SCORE_COLOR))
                    .addComponent(new TextAreaComponent('0')),
                ),
            )
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
                .addComponent(new PositionComponent((SIDE_WIDTH - BRICK_SIZE * 4) / 2, 50))
                .addComponent(new SizeComponent(SIDE_WIDTH, 40 + BRICK_SIZE * 2))
                .addEntity(
                  new BasicEntity()
                    .addComponent(new PositionComponent(10, 10))
                    .addComponent(new MaterialComponent(COLOR_WHITE))
                    .addComponent(new TextAreaComponent('NEXT:')),
                )
                .addEntity(
                  new BasicEntity(ENTITY_LABEL.NextStage)
                    .addComponent(new PositionComponent(10, 30))
                    .addEntity(new PieceEntity(PieceComponent.randomType())),
                ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(pauseSystem)
        .addSystem(moveSystem)
        .addSystem(scoreSystem);

    case SCENE_LABEL.TwoPlayer:
      return new Scene(SCENE_LABEL.TwoPlayer)
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT - 1, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(1, STAGE_HEIGHT)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Stage)
            .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(STAGE_WIDTH, STAGE_HEIGHT))
            .addEntity(new PieceEntity(PieceComponent.randomType(), ENTITY_LABEL.CurrentPiece1).transformX())
            .addEntity(new PieceEntity(PieceComponent.randomType(), ENTITY_LABEL.CurrentPiece2).transformX()),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Side)
            .addComponent(new PositionComponent(STAGE_MARGIN_LEFT + STAGE_WIDTH, STAGE_MARGIN_BLOCK))
            .addComponent(new SizeComponent(SIDE_WIDTH, STAGE_HEIGHT))
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
                .addComponent(new PositionComponent((SIDE_WIDTH - BRICK_SIZE * 4) / 2, 0))
                .addComponent(new SizeComponent(SIDE_WIDTH, 40))
                .addEntity(
                  new BasicEntity()
                    .addComponent(new PositionComponent(10, 10))
                    .addComponent(new MaterialComponent(COLOR_WHITE))
                    .addComponent(new TextAreaComponent('SCORE:')),
                )
                .addEntity(
                  new BasicEntity(ENTITY_LABEL.Score)
                    .addComponent(new PositionComponent(10, 20))
                    .addComponent(new MaterialComponent(SCORE_COLOR))
                    .addComponent(new TextAreaComponent('0')),
                ),
            )
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
                .addComponent(new PositionComponent((SIDE_WIDTH - BRICK_SIZE * 4) / 2, 50))
                .addComponent(new SizeComponent(SIDE_WIDTH, 40 + BRICK_SIZE * 2))
                .addEntity(
                  new BasicEntity()
                    .addComponent(new PositionComponent(10, 10))
                    .addComponent(new MaterialComponent(COLOR_WHITE))
                    .addComponent(new TextAreaComponent('NEXT:')),
                )
                .addEntity(
                  new BasicEntity(ENTITY_LABEL.NextStage)
                    .addComponent(new PositionComponent(10, 30))
                    .addEntity(new PieceEntity(PieceComponent.randomType())),
                ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(pauseSystem)
        .addSystem(moveSystem)
        .addSystem(scoreSystem);

    case SCENE_LABEL.About:
      return new Scene(SCENE_LABEL.About)
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.UnImplementInfo)
            .addComponent(new PositionComponent(40, 40))
            .addComponent(new SizeComponent(WIDTH - 80, HEIGHT - 80))
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addEntity(
              new BasicEntity()
                .addComponent(new MaterialComponent(COLOR_GRAY))
                .addComponent(
                  new TextAreaComponent(
                    `This is the first game released on NESBox mantou132, which is written in JavaScript, which is mainly used for learning goals.\n\nIf you are interested in NESBox, or have any suggestions, please contact me.\n\n\nThanks!`,
                    { width: WIDTH - 80 },
                  ),
                ),
            ),
        )
        .addSystem(commonSystem)
        .addSystem(pauseSystem)
        .addSystem(moveSystem);
  }
}
