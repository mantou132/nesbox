import { debounce, once } from 'duoyun-ui/lib/utils';
import { clamp } from 'duoyun-ui/lib/number';
import { default as initNes, Nes, Button } from '@mantou/nes';

import { VideoRefreshRate } from 'src/constants';
import { logger } from 'src/logger';

import type { Cheat } from 'src/configure';
import type { NesboxCanvasElement } from 'src/elements/canvas';

export function requestFrame(render: () => void, generator = VideoRefreshRate.AUTO) {
  const duration = 1000 / 60;
  const firstFramesTime: number[] = [];
  const statsLength = 30;
  let frameGenerator = generator === VideoRefreshRate.FIXED ? (window as Window).setTimeout : requestAnimationFrame;
  let timer = 0;
  let nextFrameIdealTime = performance.now();
  const nextFrame = () => {
    const now = performance.now();

    if (firstFramesTime.length >= statsLength) {
      if (generator === VideoRefreshRate.AUTO) {
        const avgTime = (firstFramesTime[statsLength - 1] - firstFramesTime[statsLength - 10]) / 10;
        const refreshDeviation = 2;
        if (avgTime < duration - refreshDeviation) {
          generator = VideoRefreshRate.FIXED;
          frameGenerator = (window as Window).setTimeout;
        } else {
          generator = VideoRefreshRate.SYNC;
        }
      }
    } else {
      firstFramesTime.push(now);
    }

    nextFrameIdealTime += duration;
    // avoid negative delay
    if (nextFrameIdealTime < now) nextFrameIdealTime = now;
    const nextFrameDelay = nextFrameIdealTime - now;
    render();
    timer = frameGenerator(nextFrame, nextFrameDelay);
  };
  nextFrame();
  return () => {
    if (frameGenerator === requestAnimationFrame) {
      cancelAnimationFrame(timer);
    } else {
      clearTimeout(timer);
    }
  };
}

const getRectCache = new WeakMap<HTMLElement, () => DOMRect>();
export const positionMapping = (event: PointerEvent, canvas: NesboxCanvasElement) => {
  if (!getRectCache.has(canvas)) {
    const fn = debounce(() => canvas.canvasRef.element!.getBoundingClientRect());
    getRectCache.set(canvas, fn);
  }
  const stage = getRectCache.get(canvas)!();
  const aspectRadio = canvas.width / canvas.height;
  const width = aspectRadio > stage.width / stage.height ? stage.width : aspectRadio * stage.height;
  const halfWidth = width / 2;
  const height = width / aspectRadio;
  const halfHeight = height / 2;

  const centerX = stage.x + stage.width / 2;
  const centerY = stage.y + stage.height / 2;

  const result = [
    clamp(0, event.x - centerX + halfWidth, width),
    clamp(0, event.y - centerY + halfHeight, height),
    event.movementX,
    event.movementY,
  ];

  const scale = width / canvas.width;
  return result.map((e) => e / scale);
};

export function mapPointerButton(event: PointerEvent) {
  switch (event.button) {
    case 0:
      return Button.PointerPrimary;
    case 2:
      return Button.PointerSecondary;
    default:
      return;
  }
}

const getDevRomFile = once(async function getDevRomFile() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const origin = 'http://localhost:8000';
      const filenames = ['index_bg.wasm', 'index.js', 'index.wasm4.wasm', 'ffightub.zip', 'alienar.zip'];
      const filename =
        filenames[
          (await Promise.all(filenames.map((filename) => fetch(`${origin}/${filename}`)))).findIndex((res) => res.ok)
        ];
      if (filename) {
        return {
          origin: origin,
          filename,
          romBuffer: await (await fetch(`${origin}/${filename}`)).arrayBuffer(),
        };
      }
    } catch {
      //
    }
  }
});

export async function watchDevRom(
  callback?: (devRom: Exclude<Awaited<ReturnType<typeof getDevRomFile>>, undefined>) => void,
) {
  const devRom = await getDevRomFile();
  if (devRom) {
    callback?.(devRom);
    new EventSource(`${devRom.origin}/esbuild`).addEventListener('change', () => location.reload());
  }
}

export async function createGame(filename: string, romBuffer: ArrayBuffer, sampleRate: number, maxPlayer?: number) {
  const devRom = await getDevRomFile();
  if (devRom) {
    filename = devRom.filename;
    romBuffer = devRom.romBuffer;
  }

  const fragments = filename.toLowerCase().split('.');

  switch (fragments.pop()) {
    case 'zip': {
      const { Arcade } = await import('@nesbox/arcade');
      const game = Arcade.new(sampleRate);
      await game.load_rom(new Uint8Array(romBuffer), fragments.join('.'));
      return game;
    }
    case 'wasm': {
      if (fragments.pop() === 'wasm4') {
        const { Wasm4 } = await import('@nesbox/wasm4');
        const game = Wasm4.new(sampleRate);
        await game.load_rom(new Uint8Array(romBuffer));
        return game;
      } else {
        await initNes(new Response(romBuffer, { headers: { 'content-type': 'application/wasm' } }));
        const game = Nes.new(sampleRate);
        logger.info(`WASM memory ${game.mem().buffer.byteLength / 1024}KB`);
        return game;
      }
    }
    case 'js': {
      const { JsGame } = await import('@mantou/nes-sandbox');
      const game = JsGame.new(sampleRate);
      await game.load_rom(new Uint8Array(romBuffer));
      return game;
    }
    case 'nes': {
      if (maxPlayer && maxPlayer > 2) {
        await initNes();
        const game = Nes.new(sampleRate);
        game.load_rom(new Uint8Array(romBuffer));
        return game;
      } else {
        const { Nes } = await import('@nesbox/fceux');
        const game = Nes.new(sampleRate);
        await game.load_rom(new Uint8Array(romBuffer));
        return game;
      }
    }
    default: {
      throw new Error('No support format');
    }
  }
}

export function parseCheatCode(cheat: Cheat) {
  // 第一段数字表示地址
  // 第二段数字
  //    第一位数字表示类型:
  //      0：始終。效果是一直保持成設定值
  //      1：一次。效果是只修改一次成設定值
  //      2：動態。效果是當內存的數值大於設定值時，自動改成設定值，相當於減小的功能
  //      3：從不。效果是當內存的數值小於設定值時，自動改成設定值，相當於加大的功能
  //    第二位数字表示字节长度
  // 第三段数字表示值（内存布局，小端字节序），例如 612 为 `01100100 00000010` => [100, 2] => 6402
  // 例子：
  // XXXX-X1-XX
  // XXXX-X2-XXXX
  // XXXX-X3-XXXXXX
  // XXXX-X4-XXXXXXXX
  const result = cheat.code.match(/^(?<addr>[0-9A-F]{4})-(?<type>[0-3])(?<len>[1-4])-(?<val>([0-9A-F]{2})+)$/);
  if (!result) return;
  const { addr, type, len, val } = result.groups!;
  const length = Number(len);
  if (val.length !== 2 * length) return;
  const bytes = val
    .split(/(\w{2}\b)/)
    .filter((e) => !!e)
    .map((e) => parseInt(e, 16));

  return {
    cheat,
    enabled: cheat.enabled,
    addr: parseInt(addr, 16),
    type: Number(type) as 0 | 1 | 2 | 3,
    len: length,
    bytes,
    val: new Uint32Array(new Uint8Array([...bytes, ...Array(4 - bytes.length)]).buffer)[0],
  };
}
