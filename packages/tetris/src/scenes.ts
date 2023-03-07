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

import {
  HEIGHT,
  WIDTH,
  SCENE_LABEL,
  ENTITY_LABEL,
  SELECT_HANDLE,
  SIDE_WIDTH,
  BACKGROUND_COLOR,
  STAGE_BACKGROUND_COLOR,
  SCORE_COLOR,
  getWorldData,
} from 'src/constants';
import { commonSystem, moveSystem, modeSelectSystem, pauseSystem, scoreSystem } from 'src/systems';

export function getScene(label: SCENE_LABEL): Scene {
  switch (label) {
    case SCENE_LABEL.Start: {
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
    }

    case SCENE_LABEL.TwoPlayer:
    case SCENE_LABEL.OnePlayer: {
      const data = getWorldData(label);
      const { brickSize, gridHeight, gridWidth } = data;
      const stageWidth = brickSize * gridWidth;
      const stageHeight = brickSize * gridHeight;
      const stageMarginBlock = (HEIGHT - stageHeight) / 2;
      const stageMarginLeft = (WIDTH - (stageWidth + SIDE_WIDTH)) / 2;
      return new Scene(SCENE_LABEL.OnePlayer)
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITY_LABEL.Background)
            .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
            .addComponent(new PositionComponent(stageMarginLeft - 1, stageMarginBlock))
            .addComponent(new SizeComponent(1, stageHeight)),
        )
        .addEntity(
          (() => {
            const entity = new BasicEntity(ENTITY_LABEL.Stage)
              .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
              .addComponent(new PositionComponent(stageMarginLeft, stageMarginBlock))
              .addComponent(new SizeComponent(stageWidth, stageHeight));
            if (label === SCENE_LABEL.TwoPlayer) {
              entity
                .addEntity(new PieceEntity(data, { label: ENTITY_LABEL.CurrentPiece1 }).transformX(data, -1))
                .addEntity(
                  new PieceEntity(data, {
                    label: ENTITY_LABEL.CurrentPiece2,
                    is2Player: true,
                  }).transformX(data, 1),
                );
            } else {
              entity.addEntity(new PieceEntity(data, { label: ENTITY_LABEL.CurrentPiece1 }).transformX(data));
            }
            return entity;
          })(),
        )
        .addEntity(
          (() => {
            const entity = new BasicEntity(ENTITY_LABEL.Side)
              .addComponent(new PositionComponent(stageMarginLeft + stageWidth, stageMarginBlock))
              .addComponent(new SizeComponent(SIDE_WIDTH, stageHeight))
              .addEntity(
                new BasicEntity()
                  .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
                  .addComponent(new PositionComponent((SIDE_WIDTH - brickSize * 4) / 2, 0))
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
                  .addComponent(new PositionComponent((SIDE_WIDTH - brickSize * 4) / 2, 50))
                  .addComponent(new SizeComponent(SIDE_WIDTH, 40 + brickSize * 2))
                  .addEntity(
                    new BasicEntity()
                      .addComponent(new PositionComponent(10, 10))
                      .addComponent(new MaterialComponent(COLOR_WHITE))
                      .addComponent(new TextAreaComponent('NEXT:')),
                  )
                  .addEntity(
                    new BasicEntity(ENTITY_LABEL.NextStage1)
                      .addComponent(new PositionComponent(10, 30))
                      .addEntity(new PieceEntity(data)),
                  ),
              );

            if (label === SCENE_LABEL.TwoPlayer) {
              entity.addEntity(
                new BasicEntity()
                  .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
                  .addComponent(new PositionComponent((SIDE_WIDTH - brickSize * 4) / 2, 125))
                  .addComponent(new SizeComponent(SIDE_WIDTH, 40 + brickSize * 2))
                  .addEntity(
                    new BasicEntity()
                      .addComponent(new PositionComponent(10, 10))
                      .addComponent(new MaterialComponent(COLOR_WHITE))
                      .addComponent(new TextAreaComponent('NEXT 2:')),
                  )
                  .addEntity(
                    new BasicEntity(ENTITY_LABEL.NextStage2)
                      .addComponent(new PositionComponent(10, 30))
                      .addEntity(new PieceEntity(data, { is2Player: true })),
                  ),
              );
            }
            return entity;
          })(),
        )
        .addSystem(commonSystem)
        .addSystem(pauseSystem)
        .addSystem(moveSystem)
        .addSystem(scoreSystem);
    }

    case SCENE_LABEL.About: {
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
}
