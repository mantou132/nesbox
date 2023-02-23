declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace globalThis {
    // eslint-disable-next-line no-var
    var nesbox: {
      _getVideoFrame: () => Uint8ClampedArray;
      _getAudioFrame: () => Float32Array;
      _getState: () => Uint8Array;
      _setState: (state?: Uint8Array) => void;
      _width: number;
      _height: number;

      control: Record<Button, boolean>;
      soundEnabled: boolean;
      videoFilter: 'default' | 'NTSC';

      init: (options: {
        width: number;
        height: number;
        /**
         * RGBA
         */
        getVideoFrame: () => Uint8ClampedArray;
        /**
         * Sample Rate: 44100
         */
        getAudioFrame: () => Float32Array;
        getState: () => Uint8Array;
        setState: (state?: Uint8Array) => void;
      }) => void;
    };
  }
}

export {};
