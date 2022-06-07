import { render, TemplateResult } from '@mantou/gem';

export const getCorsSrc = (url: string) => {
  return `https://files.xianqiao.wang/${url}`;
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
