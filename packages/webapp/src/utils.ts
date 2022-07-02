import { history, render, TemplateResult } from '@mantou/gem';
import { matchPath, RouteItem } from 'duoyun-ui/elements/route';
import { Time } from 'duoyun-ui/lib/time';

import { configure } from 'src/configure';
import { githubIssue, isTauriMacApp, isTauriWinApp } from 'src/constants';

export const getCorsSrc = (url: string) => {
  return `https://files.xianqiao.wang/${url}`;
};

export const getAvatar = (username?: string) => {
  if (!username) return '';
  return getCorsSrc(`joeschmoe.io/api/v1/${username}`);
};

export const getGithubGames = async (s: string) => {
  const search = `${githubIssue}?q=is%3Aissue+label%3Agame+${s.replaceAll(' ', '+')}`;
  const text = await (await fetch(getCorsSrc(search))).text();
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

export const isInputElement = (event: Event) => {
  const ele = event.composedPath()[0];
  return ele instanceof HTMLInputElement || ele instanceof HTMLAreaElement;
};

export const open = (uri: string) => {
  if (window.__TAURI__) {
    window.__TAURI__.shell.open(uri);
  } else {
    window.open(uri);
  }
};

export const playSound = (kind: string) => {
  window.__TAURI__?.tauri
    .invoke('play_sound', {
      kind,
      volume: configure.user?.settings.volume.notification || 0,
    })
    .catch(() => {
      //
    });
};

export const setAppBadge = (count: number) => {
  if (isTauriWinApp) {
    if (count) window.__TAURI__?.window.getCurrent().requestUserAttention(2);
  } else if (isTauriMacApp) {
    window.__TAURI__?.tauri.invoke('set_badge', { count }).catch(() => {
      //
    });
  } else {
    navigator.setAppBadge?.(count);
  }
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
