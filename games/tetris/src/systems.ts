import {
  SelectComponent,
  World,
  AudioComponent,
  PositionComponent,
  TextAreaComponent,
  RenderOnceComponent,
} from '@mantou/ecs';
import { AnimateWrapEntity, FailedEntity, PieceEntity } from 'src/entities';
import { NewPieceComponent, PieceComponent } from 'src/components';
import {
  SCENE,
  ENTITY,
  MODE,
  WorldData,
  MIN_UPDATE_FRAME,
  MAX_UPDATE_FRAME,
  ADD_SPEED_SCORE,
  SOUND,
  UPDATE_X_DELAY,
} from 'src/constants';

import { getSceneAndData } from 'src/scenes';

function renderScore(world: World<WorldData>) {
  return `${world.data.score}`.padStart(6, '0');
}

export function commonSystem(world: World<WorldData>) {
  if (
    nesbox.isTap(nesbox.players.One, nesbox.buttons.Reset) ||
    (world.data.gameOver && nesbox.isTap(nesbox.players.One, nesbox.buttons.Start)) ||
    (world.scene === SCENE.About && nesbox.isTap(nesbox.players.One))
  ) {
    world.switchScene(...getSceneAndData(SCENE.Start));
  }
}

export function pauseSystem(world: World<WorldData>) {
  switch (world.scene) {
    case SCENE.OnePlayer:
    case SCENE.TwoPlayer: {
      if (nesbox.isTap(nesbox.players.One, nesbox.buttons.Start)) {
        world.data.paused = !world.data.paused;
      }
    }
  }
}

export function modeSelectSystem(world: World<WorldData>) {
  const entity = world.getEntity(ENTITY.ModeSelect);
  if (!entity) return;

  const select = entity.getComponent(SelectComponent)!;
  if (nesbox.isTap(nesbox.players.One, nesbox.buttons.JoypadUp)) {
    select.change(-1);
    world.addAudio(new AudioComponent(SOUND.Select));
  }
  if (nesbox.isTap(nesbox.players.One, [nesbox.buttons.JoypadDown, nesbox.buttons.Select])) {
    select.change(1);
    world.addAudio(new AudioComponent(SOUND.Select));
  }
  if (nesbox.isTap(nesbox.players.One, nesbox.buttons.Start)) {
    switch (select.getCurrent()) {
      case MODE.OneMode:
        world.switchScene(...getSceneAndData(SCENE.OnePlayer));
        break;
      case MODE.TwoMode:
        world.switchScene(...getSceneAndData(SCENE.TwoPlayer));
        break;
      case MODE.About:
        world.switchScene(...getSceneAndData(SCENE.About));
        break;
    }
  }
}

function clearFullLine(world: World<WorldData>) {
  const fullLine: Set<number[]> = new Set();
  world.data.fullLineNum = [];
  world.data.grid.forEach((line, index) => {
    if (line.every((e) => !!e)) {
      fullLine.add(line);
      world.data.score++;
      world.data.fullLineNum.push(index);
    }
  });

  if (!fullLine.size) {
    addActivePiece(world);
    return;
  }

  world.addAudio(new AudioComponent(SOUND.ClearLine));

  world.data.grid = [
    ...Array.from({ length: fullLine.size }).map(() => Array.from({ length: world.data.gridWidth }, () => 0)),
    ...world.data.grid,
  ].filter((e) => !fullLine.has(e));

  world.data.fullLineNum.forEach((num) => {
    for (const entity of world.getEntity(ENTITY.Stage)!.getEntitiesIter()) {
      if (entity instanceof PieceEntity) {
        entity.removeBrickFromLine(world.data, num);
      }
    }
  });

  world.getEntity(ENTITY.Stage)!.addEntity(new AnimateWrapEntity(ENTITY.AnimateWrap).init(world.data));
}

function addActivePiece(world: World<WorldData>) {
  const stage = world.getEntity(ENTITY.Stage)!;
  const id = world.getEntity(ENTITY.CurrentPiece1) ? ENTITY.CurrentPiece2 : ENTITY.CurrentPiece1;
  const is2Player = id === ENTITY.CurrentPiece2;
  const nextPieceId = is2Player ? ENTITY.NextPiece2 : ENTITY.NextPiece1;
  const pieceOffset = world.scene === SCENE.OnePlayer ? 0 : is2Player ? 1 : -1;

  const nextPiece = world.getEntity<PieceEntity>(nextPieceId)!;

  stage.addEntity(nextPiece.addSiblingEntity(new PieceEntity(nextPieceId).init(world.data, { is2Player })));
  nextPiece.id = id;
  nextPiece.transformX(world.data, pieceOffset);

  const transformCount = Math.floor(Math.random() * 4);
  for (let i = 0; i < transformCount; i++) {
    nextPiece.transform(world.data);
  }

  if (nextPiece!.getComponent(PieceComponent)!.isCollisionGrid(world.data.grid)) {
    world.addAudio(new AudioComponent(SOUND.GameOver));
    world.data.gameOver = true;
    world.addEntity(new FailedEntity().init(renderScore(world)));
    world.getEntities().forEach((entity) => entity.addComponent(new RenderOnceComponent()));
  }
}

const updateXOffsetFrame = {
  [ENTITY.CurrentPiece1]: 0,
  [ENTITY.CurrentPiece2]: 0,
} as Record<string | number, number>;

function handleCurrentPieceEntity(world: World<WorldData>, entity: PieceEntity) {
  const is1P = entity.id === ENTITY.CurrentPiece1;
  const player = is1P ? nesbox.players.One : nesbox.players.Two;
  const piece = entity.getComponent(PieceComponent)!;
  const position = entity.getComponent(PositionComponent)!;
  const otherEntity = is1P ? world.getEntity(ENTITY.CurrentPiece2) : world.getEntity(ENTITY.CurrentPiece1);
  const otherPiece = otherEntity?.getComponent(PieceComponent);

  if (entity.hasComponent(NewPieceComponent)) {
    entity.removeComponent(NewPieceComponent);
    return;
  }

  if (nesbox.isTap(player, [nesbox.buttons.JoypadA, nesbox.buttons.JoypadB])) {
    world.addAudio(new AudioComponent(SOUND.PieceTransform));
    entity.transform(world.data);
  }

  if (nesbox.isPressed(player, nesbox.buttons.JoypadDown)) {
    world.data.updateFrame = MIN_UPDATE_FRAME;
  } else {
    world.data.updateFrame = Math.max(
      MIN_UPDATE_FRAME,
      MAX_UPDATE_FRAME - Math.floor(world.data.score / ADD_SPEED_SCORE),
    );
  }

  let shouldMoveX = 0;
  let shouldMoveY = 0;

  if (!(world.frameNum % world.data.updateFrame)) {
    shouldMoveY = world.data.brickSize;
  } else {
    shouldMoveY = 0;
  }

  // Tap the direction and adjust the position immediately
  // wait for a period of time and then accelerate to adjust the position
  const shouldUpdateXFrame =
    world.frameNum > updateXOffsetFrame[entity.id] && !((world.frameNum - updateXOffsetFrame[entity.id]) % 2);
  if (nesbox.isTap(player, nesbox.buttons.JoypadLeft)) {
    shouldMoveX = -world.data.brickSize;
    updateXOffsetFrame[entity.id] = world.frameNum + UPDATE_X_DELAY;
  } else if (nesbox.isTap(player, nesbox.buttons.JoypadRight)) {
    shouldMoveX = world.data.brickSize;
    updateXOffsetFrame[entity.id] = world.frameNum + UPDATE_X_DELAY;
  } else if (shouldUpdateXFrame && nesbox.isPressed(player, nesbox.buttons.JoypadLeft)) {
    shouldMoveX = -world.data.brickSize;
  } else if (shouldUpdateXFrame && nesbox.isPressed(player, nesbox.buttons.JoypadRight)) {
    shouldMoveX = world.data.brickSize;
  } else {
    shouldMoveX = 0;
  }

  // avoid dup sound
  if (shouldMoveX || (shouldMoveY && is1P)) {
    world.addAudio(new AudioComponent(SOUND.MovePiece));
  }

  // move x
  if (shouldMoveX) {
    position.sx = shouldMoveX;
    position.sy = 0;
    const restore = entity.update(world.data);

    // edge check
    if (piece.isCollisionGrid(world.data.grid) || piece.isCollisionPiece(otherPiece)) {
      restore();
    }
  }

  // move y
  if (shouldMoveY) {
    position.sx = 0;
    position.sy = shouldMoveY;
    const restore = entity.update(world.data);

    if (piece.isCollisionPiece(otherPiece)) {
      restore();
      return;
    }

    // should fixed
    if (piece.isCollisionGrid(world.data.grid)) {
      world.addAudio(new AudioComponent(SOUND.FixedPiece));

      // restore to before collision
      restore();

      piece.updateGrid(world.data.grid);

      // freeze current piece
      entity.id = '';

      clearFullLine(world);
    }
  }
}

export function isProcessAnimate(world: World<WorldData>) {
  const animateWrap = world.getEntity<AnimateWrapEntity>(ENTITY.AnimateWrap);
  if (animateWrap) {
    if (animateWrap.getProgress() !== 1) return true;

    animateWrap.remove();
    world.data.fullLineNum.forEach((num) => {
      for (const entity of world.getEntity(ENTITY.Stage)!.getEntitiesIter()) {
        if (entity instanceof PieceEntity) {
          entity.fallLineFromLine(world.data, num);
        }
      }
    });
    addActivePiece(world);
    world.data.fullLineNum = [];
  }
}

export function moveSystem(world: World<WorldData>) {
  if (world.data.paused || world.data.gameOver) return;

  if (isProcessAnimate(world)) return;

  const entity1 = world.getEntity<PieceEntity>(ENTITY.CurrentPiece1);
  const entity2 = world.getEntity<PieceEntity>(ENTITY.CurrentPiece2);

  [entity1, entity2]
    .filter((v): v is PieceEntity => !!v)
    .sort((a, b) => (a.isUnderPiece(b) ? -1 : 0))
    .forEach((entity) => handleCurrentPieceEntity(world, entity));

  for (const entity of world.getEntitiesIter()) {
    if (entity instanceof PieceEntity) {
      !entity.getEntities().size && entity.remove();
    }
  }
}

export function scoreSystem(world: World<WorldData>) {
  const entity = world.getEntity(ENTITY.Score);
  if (entity) {
    const textarea = entity.getComponent(TextAreaComponent)!;
    textarea.text = renderScore(world);
  }
}
