import { SelectComponent, Entity, World, AudioComponent, PositionComponent, TextAreaComponent } from '@mantou/ecs';
import { FailedEntity, PieceEntity } from 'src/entities';
import { PieceComponent } from 'src/components';

import {
  SCENES,
  ENTITIES,
  HANDLES,
  BRICK_SIZE,
  WorldDta,
  getWorldData,
  BRICK_X_NUMBER,
  BRICK_Y_NUMBER,
} from 'src/constants';
import { getScene } from 'src/scenes';

function renderScore(world: World<WorldDta>) {
  return `${world.data.score}`.padStart(6, '0');
}

export async function commonSystem(world: World<WorldDta>) {
  // last execute
  await Promise.resolve();

  world.getEntities(true).forEach((entity) => {
    if (entity.label === ENTITIES.Background) {
      entity.remove();
    }
  });

  if (nesbox.isTap(nesbox.buttons.Reset)) {
    world.switchScene(getScene(SCENES.Start), getWorldData());
  }
}

export function pauseSystem(world: World<WorldDta>) {
  if (nesbox.isTap(nesbox.buttons.Start)) {
    world.data.paused = !world.data.paused;
  }
}

export function modeSelectSystem(world: World<WorldDta>) {
  world.getEntities(true).forEach((entity: Entity) => {
    if (entity.label === ENTITIES.ModeSelect) {
      const select = entity.getComponent(SelectComponent)!;
      if (nesbox.isTap(nesbox.buttons.Joypad1Up)) {
        select.change(-1);
        world.addAudio(new AudioComponent('selectAnItem'));
      }
      if (nesbox.isTap(nesbox.buttons.Joypad1Down)) {
        select.change(1);
        world.addAudio(new AudioComponent('selectAnItem'));
      }
      if (nesbox.isTap(nesbox.buttons.Start)) {
        switch (select.getHandle()) {
          case HANDLES.OneMode:
            world.switchScene(getScene(SCENES.OnePlayer), getWorldData());
            break;
          case HANDLES.TwoMode:
            world.switchScene(getScene(SCENES.TwoPlayer), getWorldData());
            break;
        }
      }
    }
  });
}

let updateXOffsetFrame = 0;
const updateXDelayFrame = 10;
export function moveSystem(world: World<WorldDta>) {
  if (world.data.paused || world.data.failed) return;

  world.getEntities(true).forEach((entity: Entity) => {
    if (!(entity instanceof PieceEntity)) return;

    if (entity.getEntities().length === 0) {
      entity.remove();
      return;
    }

    if (entity.label === ENTITIES.CurrentPiece1) {
      const piece = entity.getComponent(PieceComponent)!;
      const originPieceGridX = piece.gridX;
      const originPieceGridY = piece.gridY;
      const position = entity.getComponent(PositionComponent)!;

      if (nesbox.isTap(nesbox.buttons.Joypad1A) || nesbox.isTap(nesbox.buttons.Joypad1B)) {
        piece.transform(world.data.grid);
        entity.transformType(piece.type);
      }

      if (nesbox.isPressed(nesbox.buttons.Joypad1Down)) {
        world.data.updateFrame = 3;
      } else {
        world.data.updateFrame = Math.max(3, 10 - Math.floor(world.data.score / 2));
      }

      const shouldUpdateY = world.frameNum % world.data.updateFrame === 0;
      if (shouldUpdateY) {
        position.sy = BRICK_SIZE;
      } else {
        position.sy = 0;
      }

      const shouldUpdateXFrame = world.frameNum > updateXOffsetFrame && (world.frameNum - updateXOffsetFrame) % 2 === 0;
      if (nesbox.isTap(nesbox.buttons.Joypad1Left) && piece.gridX > 0) {
        position.sx = -BRICK_SIZE;
        updateXOffsetFrame = world.frameNum + updateXDelayFrame;
      } else if (nesbox.isTap(nesbox.buttons.Joypad1Right) && piece.gridX + piece.cols < BRICK_X_NUMBER) {
        position.sx = BRICK_SIZE;
        updateXOffsetFrame = world.frameNum + updateXDelayFrame;
      } else if (shouldUpdateXFrame && nesbox.isPressed(nesbox.buttons.Joypad1Left) && piece.gridX > 0) {
        position.sx = -BRICK_SIZE;
      } else if (
        shouldUpdateXFrame &&
        nesbox.isPressed(nesbox.buttons.Joypad1Right) &&
        piece.gridX + piece.cols < BRICK_X_NUMBER
      ) {
        position.sx = BRICK_SIZE;
      } else {
        position.sx = 0;
      }

      const shouldUpdateX = !!position.sx;

      if (shouldUpdateX || shouldUpdateY) {
        position.update();
        piece.gridX = position.x / BRICK_SIZE;
        piece.gridY = position.y / BRICK_SIZE;

        const overflow = piece.gridY + piece.rows > BRICK_Y_NUMBER;

        if (!overflow && shouldUpdateX && piece.isCollGrid(world.data.grid)) {
          position.restore();
          piece.gridX = originPieceGridX;
          piece.gridY = originPieceGridY;
          position.sx = 0;

          position.update();
          piece.gridX = position.x / BRICK_SIZE;
          piece.gridY = position.y / BRICK_SIZE;
        }

        if (overflow || piece.isCollGrid(world.data.grid)) {
          position.restore();
          piece.gridX = originPieceGridX;
          piece.gridY = originPieceGridY;

          piece.updateGrid(world.data.grid);

          const fullLine: Set<number[]> = new Set();
          const fullLineNum: Set<number> = new Set();
          world.data.grid.forEach((line, index) => {
            if (line.every((e) => !!e)) {
              fullLine.add(line);
              world.data.score++;
              fullLineNum.add(index);
            }
          });
          world.data.grid = [
            ...Array.from({ length: fullLine.size }).map(() => Array.from({ length: BRICK_X_NUMBER }, () => 0)),
            ...world.data.grid,
          ].filter((e) => !fullLine.has(e));

          fullLineNum.forEach((num) => {
            world.getEntities(true).forEach((entity) => {
              if (entity instanceof PieceEntity) {
                entity.removeBrickFromLine(num);
              }
            });
          });

          let nextPiece: PieceEntity | undefined = undefined;
          world.getEntities(true).forEach((entity) => {
            if (entity.label === ENTITIES.NextStage) {
              nextPiece = entity.getEntities<PieceEntity>()[0];
              entity.removeEntity(nextPiece).addEntity(new PieceEntity(PieceComponent.randomType()));
            }
          });
          entity.label = '';
          nextPiece!.label = ENTITIES.CurrentPiece1;
          entity.addSiblingEntity(nextPiece!.transformX());
          if (nextPiece!.getComponent(PieceComponent)!.isCollGrid(world.data.grid)) {
            world.data.failed = true;
            world.addEntity(new FailedEntity(renderScore(world)));
          }
        }
      }
    }
  });
}

export function scoreSystem(world: World<WorldDta>) {
  world.getEntities(true).forEach((entity) => {
    if (entity.label === ENTITIES.Score) {
      const textarea = entity.getComponent(TextAreaComponent)!;
      textarea.text = renderScore(world);
    }
  });
}
