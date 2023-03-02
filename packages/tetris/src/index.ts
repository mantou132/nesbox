import { World, loadFont, loadAudio } from '@mantou/ecs';

import { HEIGHT, WIDTH } from 'src/constants';
import { getScene, Scenes } from 'src/scenes';
import { fonts, selectAnItem } from 'src/_assets';

loadFont('default', { fontSize: 10, fontSet: fonts });
loadAudio('selectAnItem', selectAnItem);

const world = new World(WIDTH, HEIGHT).switchScene(getScene(Scenes.Start));

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
    } else {
      world.switchScene(getScene(Scenes.Start));
    }
  },
});
