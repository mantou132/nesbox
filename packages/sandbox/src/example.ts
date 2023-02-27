export function example() {
  const width = 256;
  const height = 240;

  let index = 0;

  nesbox.init({
    width,
    height,
    getVideoFrame: () => {
      const frame = new Uint8ClampedArray(4 * height * width).fill(255);
      for (let i = 0; i < index * 4; i += 4) {
        frame[i] = 0;
      }
      index = (index + 1) % (height * width);
      return frame;
    },
    getAudioFrame: () => {
      return new Float32Array();
    },
    getState: () => {
      return new Uint8Array(new Uint32Array([index]).buffer);
    },
    setState: (state) => {
      if (!state) {
        index = 0;
      } else {
        index = new Uint32Array(state.buffer)[0];
      }
    },
  });
}
