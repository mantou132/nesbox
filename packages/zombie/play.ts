import * as puppeteer from 'puppeteer';

const username = process.env.LOGIN_USERNAME;
const password = process.env.LOGIN_PASSWORD || '123';

if (!username) {
  console.log('USERNAME not exist');
  process.exit(0);
}

(async () => {
  const text = await (await fetch('https://unpkg.com/deep-query-selector@1.0.1/dist/index.js')).text();
  puppeteer.registerCustomQueryHandler('shadow', {
    queryOne: new Function(
      'element',
      'selector',
      `
        ${text}
        return element.deepQuerySelector(selector);
      `,
    ) as any,
    queryAll: new Function(
      'element',
      'selector',
      `
        ${text}
        return element.deepQuerySelectorAll(selector);
      `,
    ) as any,
  });

  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--mute-audio'],
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://nesbox.xianqiao.wang/login');

  await page.waitForSelector('shadow/>>> input[name=username]', { visible: true });

  await page.type('shadow/>>> input[name=username]', username);
  await page.type('shadow/>>> input[name=password]', password);
  await page.click('shadow/>>> dy-button');

  await page.waitForSelector('shadow/>>> canvas', { visible: true });

  await new Promise((res) => setTimeout(res, 3000));

  const press = async (keys: (puppeteer.KeyInput | number)[]) => {
    for (const key of keys) {
      if (typeof key === 'number') {
        await new Promise((res) => setTimeout(res, key));
      } else {
        await new Promise((res) => setTimeout(res, 100));
        await page.keyboard.down(key);
        await new Promise((res) => setTimeout(res, 50));
        await page.keyboard.up(key);
      }
    }
  };

  press([
    'i',
    1000,
    'i',
    1000,
    'i',
    1000,
    's',
    'i',
    1000,
    's',
    'i',
    2000,
    'k',
    2000,
    '6',
    2000,
    'i',
    2000,
    '5',
    2000,
    'i',
    2000,
    '5',
    1000,
    'i',
    1000,
    'i',
    500,
    'i',
    500,
    'i',
  ]);

  console.log('playing...');
})();
