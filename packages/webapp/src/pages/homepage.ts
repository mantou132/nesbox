import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  raw,
  history,
  connectStore,
} from '@mantou/gem';
import { isMac } from 'duoyun-ui/lib/hotkeys';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { Toast } from 'duoyun-ui/elements/toast';
import { GemTitleElement } from 'duoyun-ui/elements/title';
import { createPath, RouteItem } from 'duoyun-ui/elements/route';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { routes } from 'src/routes';

import { homepageI18n } from 'src/i18n/homepage';
import { fontLoading, getCDNSrc, getCorSrc } from 'src/utils/common';
import { githubRelease, pixelFont } from 'src/constants';
import { theme } from 'src/theme';
import leftSvg from 'src/images/homepage/left.svg';
import rightSvg from 'src/images/homepage/right.svg';
import bottomSvg from 'src/images/homepage/bottom.svg';
import feature1Svg from 'src/images/homepage/feature1.svg';
import feature2Svg from 'src/images/homepage/feature2.svg';
import feature3Svg from 'src/images/homepage/feature3.svg';
import { i18n, langNames } from 'src/i18n/basic';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/paragraph';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/space';
import 'duoyun-ui/elements/select';
import 'src/elements/footer';

const downloadSvg = raw`
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.707 10.708L16.293 9.29398L13 12.587V2.00098H11V12.587L7.70697 9.29398L6.29297 10.708L12 16.415L17.707 10.708Z"></path><path d="M18 18.001V20.001H6V18.001H4V20.001C4 21.103 4.897 22.001 6 22.001H18C19.104 22.001 20 21.103 20 20.001V18.001H18Z"></path>
  </svg>
`;

const style = createCSSSheet(css`
  :host {
    display: block;
    height: 100vh;
    height: 100dvh;
    overflow: auto;
    scrollbar-width: thin;
  }
  .content {
    max-width: 70rem;
    padding-inline: 1rem;
    margin: auto;
  }
  dy-button {
    border-radius: 100em;
    line-height: 1.75;
  }

  header {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: ${theme.backgroundColor};
    overflow: hidden;
  }
  .bg {
    pointer-events: none;
  }
  .bg .light {
    position: absolute;
    inset: 0;
    background: radial-gradient(at 50% 80%, ${theme.primaryColor} 0%, transparent 50%);
    opacity: 0.2;
  }
  .bg img {
    position: absolute;
    bottom: 0;
    filter: hue-rotate(-100deg) opacity(0.2);
  }
  .bg .left {
    left: -10%;
    width: 40%;
  }
  .bg .bottom {
    left: 0;
    opacity: 0.6;
    height: 100%;
  }
  .bg .right {
    right: 0;
    width: 40%;
  }
  nav {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: 1em;
  }
  nav dy-link {
    color: inherit;
    text-decoration: none;
  }
  .links {
    display: inline-flex;
    align-items: center;
    gap: 1em;
  }
  .links dy-select {
    padding: 0;
    display: none;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    font-family: '${pixelFont.family}', sans-serif;
  }
  .logo img {
    height: 2.5em;
  }
  .logo span {
    font-size: 1.25em;
    font-weight: bold;
    margin-block-start: -0.15em;
  }
  header .main {
    display: flex;
    flex-direction: column;
    gap: 1.5em;
    max-width: 40em;
    font-size: 1.25em;
    align-items: flex-start;
    text-align: left;
    padding-block: 1em 6em;
  }
  header dy-heading {
    font-size: clamp(1.5em, 5vw, 2.5em);
  }
  section {
    background: white;
    color: ${theme.backgroundColor};
    padding-block: 2em;
    font-size: 1.25em;
    overflow: hidden;
  }
  section .content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  section img {
    width: min(40em, 90vw);
    height: auto;
  }
  section:not(.screenshot) img {
    box-sizing: border-box;
    padding-inline: 2em;
  }
  section dy-heading {
    color: inherit;
    font-size: clamp(1.5em, 5vw, 2.2em);
  }
  section:nth-of-type(2n) {
    background: ${theme.textColor};
  }
  .screenshot .content {
    gap: 3em;
    padding-block: 2em;
  }
  .screenshot dy-heading {
    position: relative;
  }
  .screenshot dy-button {
    width: 100%;
  }
  .screenshot svg {
    pointer-events: none;
    position: absolute;
    width: calc(100% + 5em);
    height: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -90%);
    filter: hue-rotate(160deg);
  }
  @media (min-width: 60em) {
    .content {
      padding-inline: 2rem;
    }
    header .main {
      padding-block: 4em 10em;
      align-items: center;
      text-align: center;
    }
    .links {
      gap: 1.5em;
    }
    .links dy-select {
      display: flex;
    }
    section:not(.screenshot) .content {
      flex-direction: row;
      gap: 1em;
    }
    section:not(.screenshot) img {
      width: 60%;
      flex-shrink: 0;
      padding: 4em;
    }
    section:not(.screenshot):nth-of-type(2n) img {
      order: 2;
    }
    .screenshot dy-button {
      width: auto;
    }
  }
`);

/**
 * @customElement p-homepage
 */
@customElement('p-homepage')
@adoptedStyle(style)
@connectStore(homepageI18n.store)
export class PHomepageElement extends GemElement {
  #openNesbox = () => {
    history.push({ path: createPath(routes.games) });
  };

  #download = async () => {
    if (navigator.userAgent.includes('Android')) {
      open(getCorSrc('https://github.com/mantou132/nesbox/releases/download/v1.0.8/nesbox.apk'));
      return;
    }
    if (mediaQuery.isPhone) {
      Toast.open('warning', homepageI18n.get('tip.homepage.notSupport'));
      return;
    }
    try {
      const latest = await waitLoading(
        fetch(getCorSrc(`${githubRelease}/latest/download/latest-version.json?t=${Date.now()}`)).then((res) =>
          res.json(),
        ),
      );
      const platforms = Object.entries(latest.platforms as Record<string, { url: string }>);
      const url = platforms.find(([key]) => key.startsWith(isMac ? 'darwin' : 'windows'))![1].url;
      open(url);
    } catch {
      open(`${githubRelease}/latest`);
    }
  };

  #onLangChange = async ({ detail }: CustomEvent<string>) => {
    await waitLoading(i18n.setLanguage(detail));
    this.update();
  };

  mounted = () => {
    fontLoading(pixelFont);
  };

  render = () => {
    return html`
      <header>
        <div class="bg" aria-hidden="true">
          <img class="bottom" src=${bottomSvg} loading="lazy" alt="" />
          <img class="left" src=${leftSvg} loading="lazy" alt="" />
          <img class="right" src=${rightSvg} loading="lazy" alt="" />
          <div class="light"></div>
        </div>
        <nav class="content">
          <dy-link class="logo" href="/">
            <img draggable="false" class="icon" src="/logo-96.png" alt="Logo" />
            <span>${GemTitleElement.defaultTitle}</span>
          </dy-link>
          <div class="links">
            <dy-select
              borderless
              @change=${this.#onLangChange}
              .value=${i18n.currentLanguage}
              .options=${Object.keys(i18n.resources).map((code) => ({
                label: langNames[code],
                value: code,
              }))}
            ></dy-select>
            <dy-link .route=${routes.login as RouteItem} data-cy="login">${i18n.get('login')}</dy-link>
          </div>
        </nav>
        <div class="content main">
          <dy-heading lv="1">${homepageI18n.get('page.homepage.header')}</dy-heading>
          <dy-paragraph>${homepageI18n.get('desc')}</dy-paragraph>
          <dy-space size="large">
            <dy-button .icon=${downloadSvg} @click=${this.#download}>
              ${homepageI18n.get('page.homepage.downloadBtn')}
            </dy-button>
            <dy-button color=${theme.textColor} @click=${this.#openNesbox}>
              ${homepageI18n.get('page.homepage.openBtn')}
            </dy-button>
          </dy-space>
        </div>
      </header>
      <main>
        ${[
          [feature1Svg, homepageI18n.get('feature1Title'), homepageI18n.get('feature1Desc')],
          [feature2Svg, homepageI18n.get('feature2Title'), homepageI18n.get('feature2Desc')],
          [feature3Svg, homepageI18n.get('feature3Title'), homepageI18n.get('feature3Desc')],
        ].map(
          ([img, title, desc]) => html`
            <section>
              <div class="content">
                <img draggable="false" src=${img} alt="feature image" width="729" height="628" />
                <div class="feature">
                  <dy-heading lv="2">${title}</dy-heading>
                  <dy-paragraph>${desc}</dy-paragraph>
                </div>
              </div>
            </section>
          `,
        )}
        <section class="screenshot">
          <div class="content">
            <img
              alt="NESBox Screenshot"
              draggable="false"
              width="800"
              height="530"
              srcset=${`${getCDNSrc(
                'https://user-images.githubusercontent.com/3841872/188081531-c0dd68b6-3603-42ae-9df0-8dad7fb211f4.png',
              )} 1024w, ${getCDNSrc(
                'https://user-images.githubusercontent.com/3841872/188080988-c40cc38a-26e2-4466-833d-cffb9ebc7f7f.png',
              )} 2272w`}
              sizes="(max-width: 1024px) 480px, 1024px"
              src=${getCDNSrc(
                'https://user-images.githubusercontent.com/3841872/188081531-c0dd68b6-3603-42ae-9df0-8dad7fb211f4.png',
              )}
            />
            <dy-heading lv="2">
              ${homepageI18n.get('journey')}
              <svg width="531" height="49" viewBox="0 0 531 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M527.098 15.0977L530.701 13.5155C530.789 13.4276 530.789 13.3397 530.701 13.3397L527.098 11.7576L525.428 8.06592C525.428 7.97803 525.34 7.97803 525.34 8.06592L523.67 11.6697L520.066 13.3397C519.978 13.3397 519.978 13.4276 520.066 13.5155L523.67 15.0977L525.34 18.7015H525.428L527.098 15.0977Z"
                  fill="#6ADBC6"
                />
                <path
                  opacity="0.5"
                  d="M303.575 6.4L306.975 4.9V4.7L303.575 3.3L302.075 0H301.875L300.375 3.3L297.075 4.7C296.975 4.8 296.975 4.9 297.075 4.9L300.375 6.4L301.875 9.8H302.075L303.575 6.4Z"
                  fill="#9691FF"
                />
                <path
                  d="M505.875 43.8621L510.95 41.6367C510.982 41.6007 511 41.5541 511 41.5058C511 41.4575 510.982 41.4109 510.95 41.3749L505.875 39.1495L503.598 34.0443C503.585 34.0304 503.57 34.0192 503.554 34.0116C503.537 34.004 503.518 34 503.5 34C503.482 34 503.463 34.004 503.446 34.0116C503.43 34.0192 503.415 34.0304 503.402 34.0443L501.125 39.0841L496.05 41.3749C496.018 41.4109 496 41.4575 496 41.5058C496 41.5541 496.018 41.6007 496.05 41.6367L501.125 43.8621L503.402 48.9018C503.489 49.0327 503.554 49.0327 503.598 48.9018L505.875 43.8621Z"
                  fill="#628BF7"
                />
                <path
                  d="M15.2764 34.15L22.9764 30.75C23.0294 30.75 23.0803 30.7289 23.1178 30.6914C23.1553 30.6539 23.1764 30.603 23.1764 30.55C23.1764 30.497 23.1553 30.4461 23.1178 30.4086C23.0803 30.3711 23.0294 30.35 22.9764 30.35L15.2764 26.95C15.2499 26.95 15.2244 26.9395 15.2057 26.9207C15.1869 26.902 15.1764 26.8765 15.1764 26.85L11.6764 19.15C11.6764 18.95 11.4764 18.95 11.3764 19.15L7.97639 26.85H7.87639L0.0763931 30.35C0.0271976 30.405 0 30.4762 0 30.55C0 30.6238 0.0271976 30.695 0.0763931 30.75L7.87639 34.15H7.97639L11.3764 41.95C11.4764 42.15 11.6764 42.15 11.6764 41.95L15.1764 34.25C15.1764 34.2235 15.1869 34.198 15.2057 34.1793C15.2244 34.1605 15.2499 34.15 15.2764 34.15Z"
                  fill="#FF7ABC"
                />
              </svg>
            </dy-heading>
            <dy-button .icon=${downloadSvg} @click=${this.#download}>
              ${homepageI18n.get('page.homepage.downloadBtn')}
            </dy-button>
          </div>
        </section>
      </main>
      <m-footer></m-footer>
    `;
  };
}
