import { Color } from '@mantou/ecs';

export const WIDTH = 256;
export const HEIGHT = 240;

export const BRICK_SIZE = 12;
export const BRICK_X_NUMBER = 12;
export const BRICK_Y_NUMBER = 18;
export const STAGE_WIDTH = BRICK_SIZE * BRICK_X_NUMBER;
export const STAGE_HEIGHT = BRICK_SIZE * BRICK_Y_NUMBER;
export const SIDE_WIDTH = 10 * 8;
export const STAGE_MARGIN_BLOCK = (HEIGHT - STAGE_HEIGHT) / 2;
export const STAGE_MARGIN_LEFT = (WIDTH - (STAGE_WIDTH + SIDE_WIDTH)) / 2;

export const MIN_UPDATE_FRAME = 3;
export const MAX_UPDATE_FRAME = 15;
export const ADD_SPEED_SCORE = 10;

export const BACKGROUND_COLOR = new Color(49, 51, 107);
export const STAGE_BACKGROUND_COLOR = new Color(13, 25, 69);
export const BORDER_COLOR = new Color(102, 120, 228);
export const SCORE_COLOR = new Color(0, 184, 198);

export const getWorldData = () => ({
  paused: false,
  updateFrame: 0,
  grid: Array.from({ length: BRICK_Y_NUMBER }, () => Array.from({ length: BRICK_X_NUMBER }, () => 0)),
  score: 0,
  gameOver: false,
});

export type WorldDta = ReturnType<typeof getWorldData>;

export enum SCENE_LABEL {
  Start,
  OnePlayer,
  TwoPlayer,
  About,
}

export enum SOUND_NAME {
  SELECT,
  MOVE_PIECE,
  FIXED_PIECE,
  CLEAR_LINE,
  GAME_OVER,
  PIECE_TRANSFORM,
}

export enum SELECT_HANDLE {
  OneMode,
  TwoMode,
  About,
}

export enum ENTITY_LABEL {
  ModeSelect,
  UnImplementInfo,
  Background,
  Stage,
  NextStage,
  Score,
  CurrentPiece1,
  CurrentPiece2,
  Side,
}
