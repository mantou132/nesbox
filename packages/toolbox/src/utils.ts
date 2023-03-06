import { clamp } from 'duoyun-ui/lib/number';

export const normalizeFilename = (filename: string) =>
  filename
    .split(/\.|,|-/)[0]
    .replace(/^./, (e) => e.toLowerCase())
    .replace(/[^a-zA-Z](.)/g, (_, char) => char.toUpperCase());

export const getInputItemType = (value: any) => {
  switch (typeof value) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'checkbox';
    default:
      return 'text';
  }
};

export const getInputItemValue = (old: any, value: string) => {
  switch (typeof old) {
    case 'number':
      return clamp(0, Number(value), 256);
    case 'boolean':
      return Boolean(value);
    default:
      return value;
  }
};

export const sampleToChart = (audio: Float32Array) => {
  const step = Math.ceil(audio.length / 20000) * 4;
  let flag = true;
  const value: number[] = [];
  for (let i = 0; i < audio.length; i += step) {
    const slice = new Float32Array(audio.buffer, i * 4, Math.min(audio.length - i, step));
    value.push(flag ? Math.min(...slice) : Math.max(...slice));
    flag = !flag;
  }
  return value;
};
