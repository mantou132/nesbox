/// <reference types="@types/emscripten" />

declare module '@mantou/fbneo/fbneo-arcade' {
  const module: EmscriptenModuleFactory<
    EmscriptenModule & {
      audioCallback: (nAudNextSound: number, length: number) => void;
      setVisibleSize: (pnWidth: number, pnHeight: number) => void;
      setAspectRatio: (pnXAspect: number, pnYAspect: number) => void;
      addFile: (RomName: number, nType: number, nRet: number) => void;
      addInput: (szName: number, key: number) => void;
      addArchive: (szName: number, szFullName: number, bFound: number) => void;
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
      FS: typeof FS;
      cwrap: typeof cwrap;
      UTF8ToString: typeof UTF8ToString;
      _startMain: any;
      _doLoop: any;
      _setForceAes;
      _forceNeoGeoBios: any;
      _setEmInput: (index: number, state: number, alx: number, aly: number, arx: number, ary: number) => void;
      _saveState: any;
      _saveAllState: any;
      _memCardInsert;
      _memCardSave: any;
      _collectGameInputs: any;
      _setGameInput: any;
      _getFireButtonCount: any;
      _isStreetFighterLayout: any;
      _getParentName: any;
    }
  >;
  export default module;
}
declare module '@mantou/fbneo/*?url' {
  const module: string;
  export default module;
}
