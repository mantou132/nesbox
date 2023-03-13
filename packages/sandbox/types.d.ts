import { Button, Player } from '@mantou/nes';

type NesBoxCommonButton =
  | 'JoypadA'
  | 'JoypadB'
  | 'JoypadTurboA'
  | 'JoypadTurboB'
  | 'JoypadUp'
  | 'JoypadDown'
  | 'JoypadLeft'
  | 'JoypadRight'
  | 'PointerLeft'
  | 'PointerRight';

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
      _pressedControl: Set<Button>;
      _tapControl: Set<Button>;

      buttons: Record<keyof typeof Button, Button>;
      players: Record<keyof typeof Player, Player>;
      buttons1: Record<NesBoxCommonButton, Button>;
      buttons2: Record<NesBoxCommonButton, Button>;
      buttons3: Record<NesBoxCommonButton, Button>;
      buttons4: Record<NesBoxCommonButton, Button>;
      soundEnabled: boolean;
      videoFilter: 'default' | 'NTSC';
      cursorPosition: Map<Player, { x: number; y: number }>;

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
