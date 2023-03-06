import { html } from '@mantou/gem';
import { RouteItem } from '@mantou/gem/elements/route';

import 'src/pages/image';
import 'src/pages/font';
import 'src/pages/audio';

export const routes: Record<string, RouteItem> = {
  home: {
    title: '',
    pattern: '/',
    redirect: '/image',
  },
  image: {
    title: '图像压缩',
    pattern: '/image',
    getContent(_params: Record<string, string>) {
      return html`<p-image></p-image>`;
    },
  },
  font: {
    title: '字体栅格化',
    pattern: '/font',
    getContent(_params: Record<string, string>) {
      return html`<p-font></p-font>`;
    },
  },
  audio: {
    title: '音频剪切',
    pattern: '/audio',
    getContent(_params: Record<string, string>) {
      return html`<p-audio></p-audio>`;
    },
  },
};
