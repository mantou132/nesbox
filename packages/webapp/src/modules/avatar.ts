import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { ElementOf, isNotNullish } from 'duoyun-ui/lib/types';
import { Modal } from 'duoyun-ui/elements/modal';

import { configure, getShortcut, toggleScreencastMode, toggleSettingsState } from 'src/configure';
import { logout } from 'src/auth';
import { changeTheme, theme, ThemeName, themeNames } from 'src/theme';
import { i18n, isCurrentLang, langNames } from 'src/i18n';
import { icons } from 'src/icons';
import { getAvatar, getCDNSrc, getGithubGames } from 'src/utils';
import { store } from 'src/store';
import { githubIssue, githubRelease } from 'src/constants';
import { logger } from 'src/logger';
import { routes } from 'src/routes';

import 'duoyun-ui/elements/coach-mark';
import 'duoyun-ui/elements/route';
import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/options';

const style = createCSSSheet(css`
  :host {
    position: relative;
    aspect-ratio: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .avatar {
    cursor: pointer;
  }
  .avatar::part(avatar) {
    box-sizing: border-box;
    border: 2px solid ${theme.textColor};
  }
`);

/**
 * @customElement m-avatar
 */
@customElement('m-avatar')
@adoptedStyle(style)
@connectStore(configure)
@connectStore(i18n.store)
export class MAvatarElement extends GemElement {
  constructor() {
    super();
    this.addEventListener('click', this.#onClick);
    this.tabIndex = 0;
    this.addEventListener('keydown', commonHandle);
  }

  #addGame = async () => {
    // 重名时游戏名称添加了`（中文/日本語）`后缀
    const map = new Map(
      Object.values(store.games)
        .filter(isNotNullish)
        .map((game) => [game.name.replace(/（.*）$/, '').replace(/\/.*$/, ''), game.id]),
    );

    const tip = i18n.get(
      'addGameDetail',
      (e) => html`<dy-link @click=${() => open(`${githubRelease}/tag/0.0.1`)}>${e}</dy-link>`,
    );

    await Modal.confirm(html`<dy-paragraph style="width:min(400px, 100vw)"> ${tip} </dy-paragraph>`);

    const excludeGames = ['马力欧兄弟/水管马力欧', '忍者神龟 街机版', 'Mighty 快打旋风', 'Super C'];
    const list: { title: string; description: string }[] = (
      await waitLoading((await fetch(getCDNSrc(`${githubRelease}/download/0.0.1/metadata.json`))).json())
    )
      .filter((e: any) => isCurrentLang({ ...e, name: e.title }) && !excludeGames.includes(e.title))
      .map((e: any) => ({ ...e, title: e.title.replace(/\/.*$/, '') }));

    const find = async (ls: typeof list): Promise<ElementOf<typeof list> | undefined> => {
      const index = ls.findIndex((e) => !map.has(e.title));
      const item = ls[index];
      if (!item) return;
      const links = await getGithubGames(item.title);
      const link = links.find((e) => e.textContent === item.title);
      if (link) logger.info('Game exist:', link.textContent);
      return link ? await find(ls.slice(index, ls.length)) : item;
    };
    const item = await waitLoading(find(list));
    if (item) {
      open(
        `${githubIssue}/new?${new URLSearchParams({
          title: item.title,
          body: item.description,
          labels: 'game',
          assignees: 'mantou132',
        })}`,
      );
    }
  };

  #onClick = (event: Event) => {
    const activeElement = event.target as HTMLElement;
    ContextMenu.open(
      [
        {
          text: i18n.get('setting'),
          handle: toggleSettingsState,
          tag: getShortcut('OPEN_SETTINGS', true),
        },
        {
          text: i18n.get('changeLanguage'),
          menu: Object.keys(i18n.resources).map((code) => ({
            selected: i18n.currentLanguage === code,
            text: langNames[code],
            handle: () => waitLoading(i18n.setLanguage(code)),
          })),
        },
        {
          text: i18n.get('changeTheme'),
          menu: Object.entries(themeNames).map(([theme, name]: [ThemeName, string]) => ({
            selected: configure.theme === theme,
            text: name,
            handle: () => changeTheme(theme),
          })),
        },
        {
          text: i18n.get('screencastMode'),
          selected: configure.screencastMode,
          handle: toggleScreencastMode,
        },
        {
          text: i18n.get('feedback'),
          tagIcon: icons.openNewWindow,
          handle: () => {
            open(githubIssue);
          },
        },
        {
          text: i18n.get('addGame'),
          tagIcon: icons.openNewWindow,
          handle: this.#addGame,
        },
        {
          text: i18n.get('official'),
          tagIcon: icons.openNewWindow,
          handle: () => {
            open(location.origin);
          },
        },
        {
          text: '---',
        },
        {
          text: i18n.get('logoutAccount', configure.user?.username || ''),
          danger: true,
          handle: logout,
        },
      ],
      { activeElement },
    );
  };

  render = () => {
    return html`
      <dy-avatar class="avatar" src=${getAvatar(configure.user?.username)}></dy-avatar>
      <dy-route
        .routes=${[
          {
            pattern: routes.room.pattern,
            content: html`<dy-coach-mark index="0"></dy-coach-mark>`,
          },
        ]}
      ></dy-route>
    `;
  };
}
