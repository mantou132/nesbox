import { SelectComponent, Entity, World, AudioComponent, PositionComponent, TextAreaComponent } from '@mantou/ecs';
import { FailedEntity, PieceEntity } from 'src/entities';
import { NewPieceComponent, PieceComponent } from 'src/components';

import {
  SCENE_LABEL,
  ENTITY_LABEL,
  SELECT_HANDLE,
  WorldDta,
  getWorldData,
  MIN_UPDATE_FRAME,
  MAX_UPDATE_FRAME,
  ADD_SPEED_SCORE,
  SOUND_NAME,
  UPDATE_X_DELAY,
} from 'src/constants';
import { getScene } from 'src/scenes';

function renderScore(world: World<WorldDta>) {
  return `${world.data.score}`.padStart(6, '0');
}

export async function commonSystem(world: World<WorldDta>) {
  // last execute
  await Promise.resolve();

  if (
    nesbox.isTap(nesbox.buttons.Reset) ||
    (world.data.gameOver && nesbox.isTap(nesbox.buttons.Start)) ||
    (world.scene === SCENE_LABEL.About && nesbox.isTap())
  ) {
    world.switchScene(getScene(SCENE_LABEL.Start), getWorldData(SCENE_LABEL.Start));
  }
}

export function pauseSystem(world: World<WorldDta>) {
  switch (world.scene) {
    case SCENE_LABEL.OnePlayer:
    case SCENE_LABEL.TwoPlayer: {
      if (nesbox.isTap(nesbox.buttons.Start)) {
        world.data.paused = !world.data.paused;
      }
    }
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
            world.switchScene(getScene(SCENE_LABEL.OnePlayer), getWorldData(SCENE_LABEL.OnePlayer));
            break;
          case SELECT_HANDLE.TwoMode:
            world.switchScene(getScene(SCENE_LABEL.TwoPlayer), getWorldData(SCENE_LABEL.TwoPlayer));
            break;
          case SELECT_HANDLE.About:
            world.switchScene(getScene(SCENE_LABEL.About), getWorldData(SCENE_LABEL.About));
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
    ...Array.from({ length: fullLine.size }).map(() => Array.from({ length: world.data.gridWidth }, () => 0)),
    ...world.data.grid,
  ].filter((e) => !fullLine.has(e));

  fullLineNum.forEach((num) => {
    world.getEntities(true).forEach((entity) => {
      if (entity instanceof PieceEntity) {
        entity.removeBrickFromLine(world.data, num);
      }
    });
  });
}

function replaceCurrentPiece(world: World<WorldDta>, entity: PieceEntity) {
  const is2Player = entity.label === ENTITY_LABEL.CurrentPiece2;
  const stageLabel = is2Player ? ENTITY_LABEL.NextStage2 : ENTITY_LABEL.NextStage1;
  const pieceOffset = world.scene === SCENE_LABEL.OnePlayer ? 0 : is2Player ? 1 : -1;

  const nextStage = world.getEntities(true).find((entity) => entity.label === stageLabel)!;
  const nextPiece = nextStage.getEntities<PieceEntity>()[0];
  nextStage.removeEntity(nextPiece).addEntity(new PieceEntity().init(world.data, { is2Player }));

  nextPiece.label = entity.label;
  entity.label = '';
  nextPiece.transformX(world.data, pieceOffset);

  const transformCount = Math.floor(Math.random() * 4);
  for (let i = 0; i < transformCount; i++) {
    nextPiece.transform(world.data);
  }

  entity.addSiblingEntity(nextPiece);

  if (nextPiece!.getComponent(PieceComponent)!.isCollisionGrid(world.data.grid)) {
    world.addAudio(new AudioComponent(SOUND_NAME.GAME_OVER));
    world.data.gameOver = true;
    world.addEntity(new FailedEntity().init(renderScore(world)));
  }
}

const updateXOffsetFrame = {
  [ENTITY_LABEL.CurrentPiece1]: 0,
  [ENTITY_LABEL.CurrentPiece2]: 0,
} as Record<string | number, number>;

function handleCurrentPieceEntity(world: World<WorldDta>, entity: PieceEntity, buttons: typeof nesbox.buttons1) {
  const piece = entity.getComponent(PieceComponent)!;
  const position = entity.getComponent(PositionComponent)!;

  if (entity.hasComponent(NewPieceComponent)) {
    entity.removeComponent(NewPieceComponent);
    return;
  }

  if (nesbox.isTap(buttons.JoypadA) || nesbox.isTap(buttons.JoypadB)) {
    world.addAudio(new AudioComponent(SOUND_NAME.PIECE_TRANSFORM));
    entity.transform(world.data);
  }

  if (nesbox.isPressed(buttons.JoypadDown)) {
    world.data.updateFrame = MIN_UPDATE_FRAME;
  } else {
    world.data.updateFrame = Math.max(
      MIN_UPDATE_FRAME,
      MAX_UPDATE_FRAME - Math.floor(world.data.score / ADD_SPEED_SCORE),
    );
  }

  const shouldUpdateY = !(world.frameNum % world.data.updateFrame);
  if (shouldUpdateY) {
    position.sy = world.data.brickSize;
  } else {
    position.sy = 0;
  }

  // Tap the direction and adjust the position immediately
  // wait for a period of time and then accelerate to adjust the position
  const shouldUpdateXFrame =
    world.frameNum > updateXOffsetFrame[entity.label] && !((world.frameNum - updateXOffsetFrame[entity.label]) % 2);
  if (nesbox.isTap(buttons.JoypadLeft) && piece.gridX > 0) {
    position.sx = -world.data.brickSize;
    updateXOffsetFrame[entity.label] = world.frameNum + UPDATE_X_DELAY;
  } else if (nesbox.isTap(buttons.JoypadRight) && piece.gridX + piece.cols < world.data.gridWidth) {
    position.sx = world.data.brickSize;
    updateXOffsetFrame[entity.label] = world.frameNum + UPDATE_X_DELAY;
  } else if (shouldUpdateXFrame && nesbox.isPressed(buttons.JoypadLeft) && piece.gridX > 0) {
    position.sx = -world.data.brickSize;
  } else if (
    shouldUpdateXFrame &&
    nesbox.isPressed(buttons.JoypadRight) &&
    piece.gridX + piece.cols < world.data.gridWidth
  ) {
    position.sx = world.data.brickSize;
  } else {
    position.sx = 0;
  }

  const shouldUpdateX = !!position.sx;

  if (shouldUpdateX || shouldUpdateY) {
    // avoid dup sound
    if (shouldUpdateX || entity.label === ENTITY_LABEL.CurrentPiece1) {
      world.addAudio(new AudioComponent(SOUND_NAME.MOVE_PIECE));
    }

    // try move
    const restore = entity.update(world.data);

    const overflow = piece.gridY + piece.rows > world.data.grid.length;

    // edge check
    if (!overflow && shouldUpdateX && piece.isCollisionGrid(world.data.grid)) {
      restore();
      position.sx = 0;
      entity.update(world.data);
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

export function moveSystem(world: World<WorldDta>) {
  if (world.data.paused || world.data.gameOver) return;

  world.getEntities(true).forEach((entity: Entity) => {
    if (!(entity instanceof PieceEntity)) return;

    if (!entity.getEntities().length) {
      entity.remove();
      return;
    }

    if (entity.label === ENTITY_LABEL.CurrentPiece1) {
      handleCurrentPieceEntity(world, entity, nesbox.buttons1);
    }

    if (entity.label === ENTITY_LABEL.CurrentPiece2) {
      handleCurrentPieceEntity(world, entity, nesbox.buttons2);
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
