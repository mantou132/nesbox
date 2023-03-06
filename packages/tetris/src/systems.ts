import { SelectComponent, Entity, World, AudioComponent, PositionComponent, TextAreaComponent } from '@mantou/ecs';
import { FailedEntity, PieceEntity } from 'src/entities';
import { NewPieceComponent, PieceComponent } from 'src/components';

import {
  SCENE_LABEL,
  ENTITY_LABEL,
  SELECT_HANDLE,
  BRICK_SIZE,
  WorldDta,
  getWorldData,
  BRICK_X_NUMBER,
  BRICK_Y_NUMBER,
  MIN_UPDATE_FRAME,
  MAX_UPDATE_FRAME,
  ADD_SPEED_SCORE,
  SOUND_NAME,
} from 'src/constants';
import { getScene } from 'src/scenes';

function renderScore(world: World<WorldDta>) {
  return `${world.data.score}`.padStart(6, '0');
}

export async function commonSystem(world: World<WorldDta>) {
  // last execute
  await Promise.resolve();

  world.getEntities(true).forEach((entity) => {
    if (entity.label === ENTITY_LABEL.Background) {
      entity.remove();
    }
  });

  if (
    nesbox.isTap(nesbox.buttons.Reset) ||
    (world.data.gameOver && nesbox.isTap(nesbox.buttons.Start)) ||
    (world.scene === SCENE_LABEL.About && nesbox.isTap())
  ) {
    world.switchScene(getScene(SCENE_LABEL.Start), getWorldData());
  }
}

export function pauseSystem(world: World<WorldDta>) {
  if (nesbox.isTap(nesbox.buttons.Start)) {
    world.data.paused = !world.data.paused;
  }
}

export function modeSelectSystem(world: World<WorldDta>) {
  world.getEntities(true).forEach((entity: Entity) => {
    if (entity.label === ENTITY_LABEL.ModeSelect) {
      const select = entity.getComponent(SelectComponent)!;
      if (nesbox.isTap(nesbox.buttons.Joypad1Up)) {
        select.change(-1);
        world.addAudio(new AudioComponent(SOUND_NAME.SELECT));
      }
      if (nesbox.isTap(nesbox.buttons.Joypad1Down)) {
        select.change(1);
        world.addAudio(new AudioComponent(SOUND_NAME.SELECT));
      }
      if (nesbox.isTap(nesbox.buttons.Start)) {
        switch (select.getHandle()) {
          case SELECT_HANDLE.OneMode:
            world.switchScene(getScene(SCENE_LABEL.OnePlayer), getWorldData());
            break;
          case SELECT_HANDLE.TwoMode:
            world.switchScene(getScene(SCENE_LABEL.TwoPlayer), getWorldData());
            break;
          case SELECT_HANDLE.About:
            world.switchScene(getScene(SCENE_LABEL.About), getWorldData());
            break;
        }
      }
    }
  });
}

function clearFullLine(world: World<WorldDta>) {
  const fullLine: Set<number[]> = new Set();
  const fullLineNum: Set<number> = new Set();
  world.data.grid.forEach((line, index) => {
    if (line.every((e) => !!e)) {
      fullLine.add(line);
      world.data.score++;
      fullLineNum.add(index);
    }
  });

  if (!fullLine.size) return;

  world.addAudio(new AudioComponent(SOUND_NAME.CLEAR_LINE));

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
}

function replaceCurrentPiece(world: World<WorldDta>, entity: PieceEntity) {
  const nextStage = world.getEntities(true).find((entity) => entity.label === ENTITY_LABEL.NextStage)!;
  const nextPiece = nextStage.getEntities<PieceEntity>()[0];
  nextStage.removeEntity(nextPiece).addEntity(new PieceEntity(PieceComponent.randomType()));

  entity.label = '';
  nextPiece.label = ENTITY_LABEL.CurrentPiece1;
  nextPiece.transformX();

  const transformCount = Math.floor(Math.random() * 4);
  for (let i = 0; i < transformCount; i++) {
    nextPiece.transform(world.data.grid);
  }

  entity.addSiblingEntity(nextPiece);

  if (nextPiece!.getComponent(PieceComponent)!.isCollisionGrid(world.data.grid)) {
    world.addAudio(new AudioComponent(SOUND_NAME.GAME_OVER));
    world.data.gameOver = true;
    world.addEntity(new FailedEntity(renderScore(world)));
  }
}

let updateXOffsetFrame = 0;
const updateXDelayFrame = 10;
export function moveSystem(world: World<WorldDta>) {
  if (world.data.paused || world.data.gameOver) return;

  world.getEntities(true).forEach((entity: Entity) => {
    if (!(entity instanceof PieceEntity)) return;

    if (!entity.getEntities().length) {
      entity.remove();
      return;
    }

    if (entity.label === ENTITY_LABEL.CurrentPiece1) {
      const piece = entity.getComponent(PieceComponent)!;
      const position = entity.getComponent(PositionComponent)!;

      if (entity.hasComponent(NewPieceComponent)) {
        entity.removeComponent(NewPieceComponent);
        return;
      }

      if (nesbox.isTap(nesbox.buttons.Joypad1A) || nesbox.isTap(nesbox.buttons.Joypad1B)) {
        world.addAudio(new AudioComponent(SOUND_NAME.PIECE_TRANSFORM));
        entity.transform(world.data.grid);
      }

      if (nesbox.isPressed(nesbox.buttons.Joypad1Down)) {
        world.data.updateFrame = MIN_UPDATE_FRAME;
      } else {
        world.data.updateFrame = Math.max(
          MIN_UPDATE_FRAME,
          MAX_UPDATE_FRAME - Math.floor(world.data.score / ADD_SPEED_SCORE),
        );
      }

      const shouldUpdateY = !(world.frameNum % world.data.updateFrame);
      if (shouldUpdateY) {
        position.sy = BRICK_SIZE;
      } else {
        position.sy = 0;
      }

      // Tap the direction and adjust the position immediately
      // wait for a period of time and then accelerate to adjust the position
      const shouldUpdateXFrame = world.frameNum > updateXOffsetFrame && !((world.frameNum - updateXOffsetFrame) % 2);
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
        world.addAudio(new AudioComponent(SOUND_NAME.MOVE_PIECE));

        // try move
        const restore = entity.update();

        const overflow = piece.gridY + piece.rows > BRICK_Y_NUMBER;

        // edge check
        if (!overflow && shouldUpdateX && piece.isCollisionGrid(world.data.grid)) {
          restore();
          position.sx = 0;
          entity.update();
        }

        // should fixed
        if (overflow || piece.isCollisionGrid(world.data.grid)) {
          world.addAudio(new AudioComponent(SOUND_NAME.FIXED_PIECE));

          // restore to before collision
          restore();

          piece.updateGrid(world.data.grid);

          clearFullLine(world);
          replaceCurrentPiece(world, entity);
        }
      }
    }
  });
}

export function scoreSystem(world: World<WorldDta>) {
  world.getEntities(true).forEach((entity) => {
    if (entity.label === ENTITY_LABEL.Score) {
      const textarea = entity.getComponent(TextAreaComponent)!;
      textarea.text = renderScore(world);
    }
  });
}
