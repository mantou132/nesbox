import { Button, Player } from '@mantou/nes';

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
      _control: Record<Player, { tap: Set<Button>; pressed: Set<Button> }>;

      buttons: Record<keyof typeof Button, Button>;
      players: Record<keyof typeof Player, Player>;
      soundEnabled: boolean;
      videoFilter: 'default' | 'NTSC';
      cursorPosition: Map<Player, { x: number; y: number }>;

      isTap: (player: Player, button?: Button | Button[]) => boolean;
      isPressed: (player: Player, button?: Button | Button[]) => boolean;

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
