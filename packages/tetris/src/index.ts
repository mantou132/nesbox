import { World, loadFont, loadAudio } from '@mantou/ecs';

import { HEIGHT, WIDTH, SCENE, WorldDta, SOUND } from 'src/constants';
import { getSceneAndData } from 'src/scenes';
import { commonSystem, modeSelectSystem, moveSystem, pauseSystem, scoreSystem } from 'src/systems';
import { eSVideoGameDescend1, fonts, headingFonts } from 'src/_assets';

loadFont('default', { fontSize: 10, fontSet: fonts });
loadFont('heading', { fontSize: 16, fontSet: headingFonts });

loadAudio(SOUND.GAME_OVER, eSVideoGameDescend1);
loadAudio(
  SOUND.CLEAR_LINE,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * 0.66) * 4, 2000),
);
loadAudio(
  SOUND.SELECT,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * 0.48) * 4, 800),
);
loadAudio(
  SOUND.MOVE_PIECE,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * (3 / 5)) * 4, 50),
);
loadAudio(
  SOUND.FIXED_PIECE,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * (3 / 5)) * 4, 500),
);
loadAudio(
  SOUND.PIECE_TRANSFORM,
  new Float32Array(eSVideoGameDescend1.buffer, Math.round(eSVideoGameDescend1.length * (1 / 6)) * 4, 400),
);

const world = new World<WorldDta>(WIDTH, HEIGHT)
  .loadScene(...getSceneAndData(SCENE.Start))
  .addSystem(commonSystem)
  .addSystem(modeSelectSystem)
  .addSystem(pauseSystem)
  .addSystem(moveSystem)
  .addSystem(scoreSystem);

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
