import * as puppeteer from 'puppeteer';

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

  await page.type('shadow/>>> input[name=username]', 'test');
  await page.type('shadow/>>> input[name=password]', '123');
  await page.click('shadow/>>> dy-button');

  await page.waitForSelector('shadow/>>> canvas', { visible: true });
  await new Promise((res) => setTimeout(res, 1000));
  await page.keyboard.press('i');

  console.log('playing...');
})();
