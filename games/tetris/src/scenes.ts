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
  RenderOnceComponent,
} from '@mantou/ecs';
import { PieceEntity } from 'src/entities';
import {
  HEIGHT,
  WIDTH,
  SCENE,
  ENTITY,
  MODE,
  SIDE_WIDTH,
  BACKGROUND_COLOR,
  STAGE_BACKGROUND_COLOR,
  SCORE_COLOR,
  getWorldData,
} from 'src/constants';

export function getSceneAndData(label: SCENE) {
  const scene = new Scene(label);
  const data = getWorldData(label);
  switch (label) {
    case SCENE.Start: {
      scene
        .addEntity(
          new BasicEntity()
            .addComponent(new RenderOnceComponent())
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity()
            .addComponent(new RenderOnceComponent())
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
          new BasicEntity()
            .addComponent(new RenderOnceComponent())
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(WIDTH / 2 - 30, 90))
            .addComponent(new SizeComponent(61, 3)),
        )
        .addEntity(
          new BasicEntity()
            .addComponent(new PositionComponent(90, 120))
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addEntity(
              new BasicEntity(ENTITY.ModeSelect)
                .addComponent(new MaterialComponent(COLOR_WHITE))
                .addComponent(new SelectComponent([MODE.OneMode, MODE.TwoMode, MODE.None, MODE.About])),
            ),
        );
      break;
    }

    case SCENE.TwoPlayer:
    case SCENE.OnePlayer: {
      const { brickSize, gridHeight, gridWidth } = data;
      const stageWidth = brickSize * gridWidth;
      const stageHeight = brickSize * gridHeight;
      const stageMarginBlock = (HEIGHT - stageHeight) / 2;
      const stageMarginLeft = (WIDTH - (stageWidth + SIDE_WIDTH)) / 2;
      scene
        .addEntity(
          new BasicEntity()
            .addComponent(new RenderOnceComponent())
            .addComponent(new MaterialComponent(BACKGROUND_COLOR))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity()
            .addComponent(new RenderOnceComponent())
            .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
            .addComponent(new PositionComponent(stageMarginLeft - 1, stageMarginBlock))
            .addComponent(new SizeComponent(1, stageHeight)),
        )
        .addEntity(
          (() => {
            const entity = new BasicEntity(ENTITY.Stage)
              .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
              .addComponent(new PositionComponent(stageMarginLeft, stageMarginBlock))
              .addComponent(new SizeComponent(stageWidth, stageHeight));
            if (label === SCENE.TwoPlayer) {
              entity
                .addEntity(new PieceEntity(ENTITY.CurrentPiece1).init(data).transformX(data, -1))
                .addEntity(new PieceEntity(ENTITY.CurrentPiece2).init(data, { is2Player: true }).transformX(data, 1));
            } else {
              entity.addEntity(new PieceEntity(ENTITY.CurrentPiece1).init(data).transformX(data));
            }
            return entity;
          })(),
        )
        .addEntity(
          (() => {
            const entity = new BasicEntity(ENTITY.Side)
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
                    new BasicEntity(ENTITY.Score)
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
                    new BasicEntity()
                      .addComponent(new PositionComponent(10, 30))
                      .addEntity(new PieceEntity(ENTITY.NextPiece1).init(data)),
                  ),
              );

            if (label === SCENE.TwoPlayer) {
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
                    new BasicEntity()
                      .addComponent(new PositionComponent(10, 30))
                      .addEntity(new PieceEntity(ENTITY.NextPiece2).init(data, { is2Player: true })),
                  ),
              );
            }
            return entity;
          })(),
        );
      break;
    }

    case SCENE.About: {
      scene
        .addEntity(
          new BasicEntity()
            .addComponent(new RenderOnceComponent())
            .addComponent(new MaterialComponent(COLOR_WHITE))
            .addComponent(new PositionComponent(0, 0)),
        )
        .addEntity(
          new BasicEntity(ENTITY.UnImplementInfo)
            .addComponent(new PositionComponent(40, 40))
            .addComponent(new RenderOnceComponent())
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
        );
      break;
    }
  }
  return [scene, data] as const;
}
