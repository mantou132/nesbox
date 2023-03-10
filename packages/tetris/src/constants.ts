import { Color } from '@mantou/ecs';

export const WIDTH = 256;
export const HEIGHT = 240;
export const SIDE_WIDTH = 10 * 8;

export const MIN_UPDATE_FRAME = 3;
export const MAX_UPDATE_FRAME = 15;
export const ADD_SPEED_SCORE = 10;
export const UPDATE_X_DELAY = 10;

export const BACKGROUND_COLOR = new Color(49, 51, 107);
export const STAGE_BACKGROUND_COLOR = new Color(13, 25, 69);
export const BORDER_COLOR = new Color(102, 120, 228);
export const SCORE_COLOR = new Color(0, 184, 198);

export const getWorldData = (
  scene: SCENE,
  { brickSize, gridWidth, gridHeight } = scene === SCENE.TwoPlayer
    ? {
        brickSize: 10,
        gridWidth: 14,
        gridHeight: 21,
      }
    : {
        brickSize: 12,
        gridWidth: 12,
        gridHeight: 18,
      },
) => ({
  paused: false,
  updateFrame: 0,
  brickSize,
  gridWidth,
  gridHeight,
  grid: Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => 0)),
  score: 0,
  gameOver: false,
});

export type WorldDta = ReturnType<typeof getWorldData>;

export enum SCENE {
  Start,
  OnePlayer,
  TwoPlayer,
  About,
}

export enum SOUND {
  SELECT,
  MOVE_PIECE,
  FIXED_PIECE,
  CLEAR_LINE,
  GAME_OVER,
  PIECE_TRANSFORM,
}

export enum MODE {
  OneMode = '1 Player',
  TwoMode = '2 Player',
  About = 'About',
  None = '',
}

export enum ENTITY {
  ModeSelect,
  UnImplementInfo,
  Stage,
  NextPiece1,
  NextPiece2,
  Score,
  CurrentPiece1,
  CurrentPiece2,
  Side,
}
