import { Button } from '@mantou/nes';

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
      _control: Record<Button, boolean>;
      _prevControl: Record<Button, boolean>;

      buttons: Record<keyof typeof Button, Button>;
      soundEnabled: boolean;
      videoFilter: 'default' | 'NTSC';

      isTap: (arg?: Button) => boolean;
      isPressed: (arg?: Button) => boolean;

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
