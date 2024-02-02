export const removePunctuation = (str: string) =>
  str
    .replace(/(.*), (\w+)/, '$2 $1')
    .replace(/\p{gc=Punctuation}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('brothers', 'bros');
export const incudesString = (str1: string, str2: string) => str1.includes(str2) || str2.includes(str1);
export const normalize = (str: string) => str.replaceAll('–', '-').replaceAll('’', "'").replaceAll('‘', "'");

export const existGames = [
  '热血格斗传说',
  '坦克大战',
  '烟山坦克 1990',
  '热血新纪录',
  '热血物语',
  '热血篮球',
  '热血足球',
];
