/// <reference types="@types/emscripten" />

declare module '@mantou/fbneo/fbneo-arcade' {
  const module: EmscriptenModuleFactory<
    EmscriptenModule & {
      // global method/var
      FS: typeof FS;
      cwrap: typeof cwrap;
      UTF8ToString: typeof UTF8ToString;

      // used cpp export
      _doLoop: () => void;
      _saveAllState: (isSave: number) => void;
      _collectGameInputs: () => void;
      _setEmInput: (index: number, state: number, alx: number, aly: number, arx: number, ary: number) => void;
      _collectMemory: () => number;
      _getMemorySize: () => number;
      _readMemory: (addr: number) => number;
      _writeMemory: (addr: number, val: number) => number;

      // wrap `_startMain`
      start: () => void;

      // cpp call
      setRomProps: (
        nVidImageWidth: number,
        nVidImageHeight: number,
        nRotateGame: number,
        bFlipped: number,
        nVidImageDepth: number,
        nBurnFPS: number,
        GameAspectX: number,
        GameAspectY: number,
      ) => void;
      drawScreen: (pVidImage: number) => void;
      audioCallback: (nAudNextSound: number, length: number) => void;
      setVisibleSize: (pnWidth: number, pnHeight: number) => void;
      setAspectRatio: (pnXAspect: number, pnYAspect: number) => void;
      // log ?
      addFile: (RomName: number, nType: number, nRet: number) => void;
      addInput: (szName: number, key: number) => void;
      addArchive: (szName: number, szFullName: number, bFound: number) => void;
    }
  >;
  export default module;
}
declare module '@mantou/fbneo/*?url' {
  const module: string;
  export default module;
}
