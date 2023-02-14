import { history, QueryString, render, TemplateResult } from '@mantou/gem';
import { matchPath, RouteItem } from 'duoyun-ui/elements/route';
import { Time } from 'duoyun-ui/lib/time';
import { ValueOf } from 'duoyun-ui/lib/types';
import { mtApp } from 'mt-app';

import { configure } from 'src/configure';
import { githubIssue, queryKeys, VideoRefreshRate } from 'src/constants';
import { logger } from 'src/logger';

export const getCorSrc = (url: string) => {
  return `https://files.xianqiao.wang/${url}`;
};

export const getCDNSrc = (url: string) => {
  // return `https://nesbox-cdn.liuben.fun/${url}`;
  return getCorSrc(url);
};

export const getAvatar = (username?: string) => {
  if (!username) return '';
  return `https://api.dicebear.com/5.x/pixel-art/svg?seed=${encodeURIComponent(username)}&backgroundColor=c0aede`;
};

export const getGithubGames = async (s: string) => {
  const search = `${githubIssue}?q=is%3Aissue+label%3Agame+${encodeURIComponent(s.replaceAll(' ', '+'))}`;
  const text = await (await fetch(getCorSrc(search))).text();
  const domParse = new DOMParser();
  const doc = domParse.parseFromString(text, 'text/html');
  return [...doc.querySelectorAll('[aria-label=Issues] a[id^=issue]')] as HTMLAnchorElement[];
};

export const getTempText = (html: TemplateResult) => {
  const div = document.createElement('div');
  render(html, div);
  return div.textContent || '';
};

export const documentVisible = async () => {
  if (document.visibilityState === 'visible') return;
  await new Promise((res) => document.addEventListener('visibilitychange', res, { once: true }));
};

export const playSound = async (kind: string, volume = configure.user?.settings.volume.notification) => {
  try {
    if (!kind) {
      await mtApp.playSound('click');
    } else {
      await window.__TAURI__?.tauri.invoke('play_sound', {
        kind,
        volume: volume || 0,
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

export const saveFile = async (file: File) => {
  try {
    if (!window.__TAURI__) throw new Error();
    const { writeBinaryFile, BaseDirectory } = window.__TAURI__.fs;
    await writeBinaryFile(
      file.name.replaceAll(' ', '-').replaceAll(':', '-'),
      new Uint8Array(await file.arrayBuffer()),
      { dir: BaseDirectory.Desktop },
    );
    return BaseDirectory.Desktop;
  } catch (err) {
    logger.warn(err);
    const a = document.createElement('a');
    a.download = file.name;
    a.href = URL.createObjectURL(file);
    document.body.append(a);
    a.click();
    a.remove();
    addEventListener('focus', () => setTimeout(() => URL.revokeObjectURL(a.href), 1000), { once: true });
    return undefined;
  }
};

export const playHintSound = (kind = '') => {
  playSound(kind, configure.user!.settings.volume.hint);
};

export const formatTime = (timestamp: number) => {
  const time = new Time(timestamp);
  if (new Time().isSome(time, 'd')) {
    return time.format('HH:mm:ss');
  }
  if (new Time().isSome(time, 'Y')) {
    return time.format('MM-DD HH:mm:ss');
  }
  return time.format();
};

export const matchRoute = (route: RouteItem) => matchPath(route.pattern, history.getParams().path);

export function changeQuery(
  key: ValueOf<typeof queryKeys>,
  value: undefined | null | string | number | string[] | number[],
) {
  const p = history.getParams();
  const query = new QueryString(p.query);
  if (!value) {
    query.delete(key);
  } else if (Array.isArray(value)) {
    query.setAny(key, value);
  } else {
    query.set(key, String(value));
  }
  history.replace({ ...p, query });
}

export const preventDefault = (fn: () => void) => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    fn();
  };
};

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

export const fontLoading = (font: FontFace) => {
  if (document.fonts.has(font)) return;
  font
    .load()
    .then((font) => document.fonts.add(font))
    .catch(() => {
      //
    });
};
