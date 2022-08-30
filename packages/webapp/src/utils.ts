import { history, render, TemplateResult } from '@mantou/gem';
import { matchPath, RouteItem } from 'duoyun-ui/elements/route';
import { Time } from 'duoyun-ui/lib/time';

import { configure } from 'src/configure';
import { githubIssue } from 'src/constants';

export function convertObjectSnakeToCamelCase(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [key.replace(/_(.)/g, (_substr, $1: string) => $1.toUpperCase()), val]),
  );
}

export function convertObjectCamelCaseToSnake(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [key.replace(/[A-Z]{1,2}/g, ($1: string) => '_' + $1.toLowerCase()), val]),
  );
}

export const getCorSrc = (url: string) => {
  return `https://files.xianqiao.wang/${url}`;
};

export const getCDNSrc = (url: string) => {
  return `https://nesbox-cdn.liuben.fun/${url}`;
};

export const getAvatar = (username?: string) => {
  if (!username) return '';
  return getCDNSrc(`joeschmoe.io/api/v1/${username}`);
};

export const getGithubGames = async (s: string) => {
  const search = `${githubIssue}?q=is%3Aissue+label%3Agame+${encodeURIComponent(s.replaceAll(' ', '+'))}`;
  const text = await (await fetch(getCorSrc(search))).text();
  const domparse = new DOMParser();
  const doc = domparse.parseFromString(text, 'text/html');
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

export const playSound = (kind: string, volume = configure.user?.settings.volume.notification) => {
  window.__TAURI__?.tauri
    .invoke('play_sound', {
      kind,
      volume: volume || 0,
    })
    .catch(() => {
      //
    });
};

export const saveFile = async (file: File) => {
  try {
    if (!window.__TAURI__) throw new Error();
    const { writeBinaryFile, BaseDirectory } = window.__TAURI__.fs;
    await writeBinaryFile(file.name, new Uint8Array(await file.arrayBuffer()), { dir: BaseDirectory.Desktop });
    return BaseDirectory.Desktop;
  } catch {
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

export const playHintSound = (kind: string) => {
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

export const preventDefault = (fn: () => void) => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    fn();
  };
};
