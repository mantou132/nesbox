import { Button, Player } from '@mantou/nes';

type Cursor = { x: number; y: number; dx: number; dy: number };

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
      _cursor: Map<Player, Cursor>;

      buttons: Record<keyof typeof Button, Button>;
      players: Record<keyof typeof Player, Player>;

      isTap: (player: Player, button?: Button | Button[]) => boolean;
      isPressed: (player: Player, button?: Button | Button[]) => boolean;
      getCursor: (player: Player) => Cursor | undefined;

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
