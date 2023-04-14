import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { Modal } from 'duoyun-ui/elements/modal';
import { locale } from 'duoyun-ui/lib/locale';
import { routes } from 'src/routes';

import { getAvatar } from 'src/utils/common';
import { githubIssue } from 'src/constants';
import { configure, getShortcut, toggleScreencastMode, toggleSettingsState } from 'src/configure';
import { logout } from 'src/auth';
import { changeTheme, theme, ThemeName, themeNames } from 'src/theme';
import { i18n, langNames } from 'src/i18n/basic';
import { icons } from 'src/icons';

import type { MNewGameElement } from 'src/modules/new-game';

import 'duoyun-ui/elements/coach-mark';
import 'duoyun-ui/elements/route';
import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/options';
import 'src/modules/new-game';

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
    const newGameElement = await Modal.open<MNewGameElement>({
      header: i18n.get('addGame'),
      body: html`<m-new-game></m-new-game>`,
      okText: locale.nextTour,
    });

    open(
      `${githubIssue}/new?${new URLSearchParams({
        title: newGameElement.state.title,
        body: newGameElement.state.description,
        labels: [
          'game',
          newGameElement.state.kind,
          newGameElement.state.series,
          newGameElement.state.maxPlayer,
          newGameElement.state.platform,
        ]
          .filter((e) => !!e)
          .join(),
        assignees: 'mantou132',
      })}`,
    );
  };

  #onClick = (event: Event) => {
    const activeElement = event.target as HTMLElement;
    ContextMenu.open(
      [
        {
          text: i18n.get('settings.title'),
          handle: toggleSettingsState,
          tag: getShortcut('OPEN_SETTINGS', true),
        },
        {
          text: i18n.get('settings.ui.language'),
          menu: Object.keys(i18n.resources).map((code) => ({
            selected: i18n.currentLanguage === code,
            text: langNames[code],
            handle: () => waitLoading(i18n.setLanguage(code)),
          })),
        },
        {
          text: i18n.get('settings.ui.theme'),
          menu: Object.entries(themeNames).map(([theme, name]: [ThemeName, string]) => ({
            selected: configure.theme === theme,
            text: name,
            handle: () => changeTheme(theme),
          })),
        },
        {
          text: i18n.get('settings.ui.screencastMode'),
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
