import type { Color, Font } from './assets';

export function mixColor(bgColor: Color, [fgR, fgG, fgB, fgA]: Color) {
  // https://stackoverflow.com/questions/726549/algorithm-for-additive-color-mixing-for-rgb-values
  const bgA = bgColor[3];
  const rA = (bgColor[3] = 255 - (255 - fgA) * (1 - bgColor[3] / 255));
  bgColor[0] = (fgR * fgA) / rA + (bgColor[0] * bgA * (1 - fgA / 255)) / rA;
  bgColor[1] = (fgG * fgA) / rA + (bgColor[1] * bgA * (1 - fgA / 255)) / rA;
  bgColor[2] = (fgB * fgA) / rA + (bgColor[2] * bgA * (1 - fgA / 255)) / rA;
}

// simple word segmentation rules
export function getWords(str: string) {
  const result: string[] = [];
  const words = str.split(/(\p{sc=Han}|\p{sc=Katakana}|\p{sc=Hiragana}|\p{sc=Hang}|\p{gc=Punctuation})|\s+/gu);
  let tempWord = '';
  words.forEach((word = ' ') => {
    if (word) {
      if (tempWord && /(“|')$/.test(tempWord) && word !== ' ') {
        // End of line not allowed
        tempWord += word;
      } else if (/(,|\.|\?|:|;|'|，|。|？|：|；|”)/.test(word) && tempWord !== ' ') {
        // Start of line not allowed
        tempWord += word;
      } else {
        if (tempWord) result.push(tempWord);
        tempWord = word;
      }
    }
  });
  if (tempWord) result.push(tempWord);
  return result;
}

const cache = new Map<string, string[]>();
export function getLines(text: string, maxWidth: number, font: Font) {
  if (!cache.has(text)) {
    const paragraphs = text.split('\n').map((text) => {
      const words = getWords(text);
      const lines: string[] = [];
      let lastLine = '';
      let lastLineWidth = 0;
      for (const word of words) {
        const w = [...word].reduce((p, c) => p + font.fontSet[c].width, 0);
        if (lastLineWidth + w <= maxWidth) {
          lastLine += word;
          lastLineWidth += w;
        } else {
          lines.push(lastLine);
          if (/\s/.test(word)) {
            lastLine = '';
            lastLineWidth = 0;
          } else {
            lastLine = word;
            lastLineWidth = w;
          }
        }
      }
      if (lastLine) lines.push(lastLine);
      if (!text) lines.push(' ');
      return lines;
    });

    cache.set(text, paragraphs.flat());
  }
  return cache.get(text)!;
}
