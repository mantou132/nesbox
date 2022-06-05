import { render, TemplateResult } from '@mantou/gem';

export const getCorsSrc = (url: string) => {
  return `https://files.xianqiao.wang/${url}`;
};

export const getTempText = (html: TemplateResult) => {
  const div = document.createElement('div');
  render(html, div);
  return div.textContent || '';
};
