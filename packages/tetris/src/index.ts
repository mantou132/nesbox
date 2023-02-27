import { HEIGHT, WIDTH } from 'src/constants';
import { selectAnItem } from 'src/_assets';

let frameNum = 0;

nesbox.init({
  width: WIDTH,
  height: HEIGHT,
  getVideoFrame: () => {
    const frame = new Uint8ClampedArray(4 * HEIGHT * WIDTH).fill(255);
    for (let i = 0; i < frameNum * 4; i += 4) {
      frame[i] = 0;
    }
    frameNum = (frameNum + 1) % (HEIGHT * WIDTH);
    return frame;
  },
  getAudioFrame: () => {
    const frameLen = 44100 / 60;
    const len = selectAnItem.length - (selectAnItem.length % frameLen);
    return new Float32Array(selectAnItem.buffer, (frameNum * frameLen * 4) % (len * 4), frameLen);
  },
  getState: () => {
    return new Uint8Array(new Uint32Array([frameNum]).buffer);
  },
  setState: (state) => {
    if (!state) {
      frameNum = 0;
    } else {
      frameNum = new Uint32Array(state.buffer)[0];
    }
  },
});

export {};
