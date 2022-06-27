import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, styleMap } from '@mantou/gem';
import { isMac } from 'duoyun-ui/lib/hotkeys';

import { getCorsSrc, open } from 'src/utils';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/paragraph';
import 'duoyun-ui/elements/button';

const style = createCSSSheet(css`
  .bg {
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    mix-blend-mode: multiply;
    pointer-events: none;
  }
  main {
    position: absolute;
    inset: 0;
    margin: auto;
    display: flex;
    align-items: center;
    width: min(80vw, 90em);
    gap: 1em;
  }
  .content {
    margin-block-start: -3em;
    width: 33%;
    display: flex;
    flex-direction: column;
    text-align: justify;
  }
  main img {
    width: 100%;
  }
`);

/**
 * @customElement p-download
 */
@customElement('p-download')
@adoptedStyle(style)
export class PDownloadElement extends GemElement {
  #download = () => {
    open(
      getCorsSrc(
        isMac
          ? 'https://github.com/mantou132/nesbox/releases/download/0.0.1/NESBox_0.1.0_x64.dmg'
          : 'https://github.com/mantou132/nesbox/releases/download/0.0.1/NESBox_0.1.0_x64_en-US.msi',
      ),
    );
  };

  render = () => {
    return html`
      <img
        class="bg"
        src=${getCorsSrc(
          'https://cdn.dribbble.com/users/870476/screenshots/10244007/media/ba3b0d812068691f20b835e7381284b1.jpg',
        )}
      />
      <main>
        <div class="content">
          <dy-heading>NESBox</dy-heading>
          <dy-paragraph>
            在 NESBox 上，你可以玩成百上千款红白机游戏，此外，你还可以添加好友，邀请好友联机游戏。
          </dy-paragraph>
          <dy-button style=${styleMap({ marginBlockStart: '1em' })} @click=${this.#download}>立即下载</dy-button>
        </div>
        <img src=${getCorsSrc('https://raw.githubusercontent.com/mantou132/nesbox/master/screenshots/homepage.png')} />
      </main>
    `;
  };
}
