export const WIDTH = 256;
export const HEIGHT = 240;

export const BRICK_SIZE = 8;
export const BRICK_X_NUMBER = 16;
export const BRICK_Y_NUMBER = 24;
export const STAGE_WIDTH = BRICK_SIZE * BRICK_X_NUMBER;
export const STAGE_HEIGHT = BRICK_SIZE * BRICK_Y_NUMBER;
export const SIDE_WIDTH = 10 * 8;
export const STAGE_MARGIN_BLOCK = (HEIGHT - STAGE_HEIGHT) / 2;
export const STAGE_MARGIN_LEFT = (WIDTH - (STAGE_WIDTH + SIDE_WIDTH)) / 2;

export const getWorldData = () => ({
  paused: false,
  updateFrame: 20,
  grid: Array.from({ length: BRICK_Y_NUMBER }, () => Array.from({ length: BRICK_X_NUMBER }, () => 0)),
  score: 0,
  failed: false,
});

export type WorldDta = ReturnType<typeof getWorldData>;

export enum SCENES {
  Start,
  OnePlayer,
  TwoPlayer,
}

export enum HANDLES {
  OneMode,
  TwoMode,
}

export enum ENTITIES {
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
