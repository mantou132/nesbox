import { World, loadFont, loadAudio } from '@mantou/ecs';

import { HEIGHT, WIDTH, SCENE_LABEL, WorldDta, getWorldData, SOUND_NAME } from 'src/constants';
import { getScene } from 'src/scenes';
import { eSVideoGameDescend1, fonts, headingFonts } from 'src/_assets';

loadFont('default', { fontSize: 10, fontSet: fonts });
loadFont('heading', { fontSize: 16, fontSet: headingFonts });

loadAudio(SOUND_NAME.GAME_OVER, eSVideoGameDescend1);
loadAudio(
  SOUND_NAME.CLEAR_LINE,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * 0.66) * 4, 2000),
);
loadAudio(
  SOUND_NAME.SELECT,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * 0.48) * 4, 800),
);
loadAudio(
  SOUND_NAME.MOVE_PIECE,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * (3 / 5)) * 4, 50),
);
loadAudio(
  SOUND_NAME.FIXED_PIECE,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * (3 / 5)) * 4, 500),
);
loadAudio(
  SOUND_NAME.PIECE_TRANSFORM,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * (1 / 6)) * 4, 400),
);

const world = new World<WorldDta>(WIDTH, HEIGHT).loadScene(getScene(SCENE_LABEL.Start), getWorldData());

nesbox.init({
  width: WIDTH,
  height: HEIGHT,
  getVideoFrame: () => {
    world.update();
    return world.getVideoFrame();
  },
  getAudioFrame: () => {
    return world.getAudioFrame();
  },
  getState: () => {
    return world.getState();
  },
  setState: (state) => {
    if (state) {
      world.setState(state);
    }
  },
});
