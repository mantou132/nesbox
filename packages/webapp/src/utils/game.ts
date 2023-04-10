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
      const filenames = ['index_bg.wasm', 'index.js', 'index.wasm4.wasm', 'ffightub.arcade.zip', 'alienar.arcade.zip'];
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

export async function createGame(filename: string, romBuffer: ArrayBuffer, sampleRate: number) {
  const devRom = await getDevRomFile();
  if (devRom) {
    filename = devRom.filename;
    romBuffer = devRom.romBuffer;
  }

  const fragments = filename.toLowerCase().split('.');

  switch (fragments.pop()) {
    case 'zip': {
      if (fragments.pop() === 'arcade') {
        const { Nes } = await import('@mantou/arcade');
        const game = Nes.new(sampleRate);
        await game.load_rom(new Uint8Array(romBuffer), fragments.join('.'));
        return game;
      } else {
        throw new Error('not support');
      }
    }
    case 'wasm': {
      if (fragments.pop() === 'wasm4') {
        const { Nes } = await import('@mantou/nes-wasm4');
        const game = Nes.new(sampleRate);
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
      const { Nes } = await import('@mantou/nes-sandbox');
      const game = Nes.new(sampleRate);
      await game.load_rom(new Uint8Array(romBuffer));
      return game;
    }
    default: {
      await initNes();
      const game = Nes.new(sampleRate);
      game.load_rom(new Uint8Array(romBuffer));
      return game;
    }
  }
}

export function parseCheatCode(cheat: Cheat) {
  const result = cheat.code.match(/^(?<addr>[0-9A-F]{4})-(?<type>[0-3])(?<len>[1-4])-(?<val>([0-9A-F]{2})+)$/);
  if (!result) return;
  const { addr, type, len, val } = result.groups!;
  if (val.length !== 2 * Number(len)) return;
  return {
    cheat,
    enabled: cheat.enabled,
    addr: parseInt(addr, 16),
    type: Number(type) as 0 | 1 | 2 | 3,
    len: Number(len),
    val: val
      .split(/(\w{2}\b)/)
      .filter((e) => !!e)
      .map((e) => parseInt(e, 16)),
  };
}
