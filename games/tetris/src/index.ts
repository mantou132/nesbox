import { World, loadFont, loadAudio, loadSprite } from '@mantou/ecs';
import { HEIGHT, WIDTH, SCENE, WorldData, SOUND, SPRITE, BORDER_COLOR } from 'src/constants';

import { getSceneAndData } from 'src/scenes';
import { commonSystem, modeSelectSystem, moveSystem, pauseSystem, scoreSystem } from 'src/systems';
import { sound, fonts, headingFonts } from 'src/_assets';

loadFont('default', { fontSize: 10, fontSet: fonts });
loadFont('heading', { fontSize: 16, fontSet: headingFonts });

loadAudio(SOUND.GameOver, sound);
loadAudio(SOUND.ClearLine, new Float32Array(sound.buffer, Math.round(sound.length * 0.66) * 4, 2000));
loadAudio(SOUND.Select, new Float32Array(sound.buffer, Math.round(sound.length * 0.48) * 4, 800));
loadAudio(SOUND.MovePiece, new Float32Array(sound.buffer, Math.round(sound.length * 0.6) * 4, 50));
loadAudio(SOUND.FixedPiece, new Float32Array(sound.buffer, Math.round(sound.length * 0.6) * 4, 500));
loadAudio(SOUND.PieceTransform, new Float32Array(sound.buffer, Math.round(sound.length * 0.17) * 4, 400));

loadSprite(SPRITE.ClearLineAnimate1, { width: 1, data: new Uint8ClampedArray([...BORDER_COLOR, 0, 0, 0, 0]) });
loadSprite(SPRITE.ClearLineAnimate2, { width: 1, data: new Uint8ClampedArray([0, 0, 0, 0, ...BORDER_COLOR]) });

const world = new World<WorldData>(WIDTH, HEIGHT)
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
