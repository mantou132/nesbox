import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { waitLoading } from 'duoyun-ui/elements/wait';

import { configure, getShortcut, toggoleScreencaseMode, toggoleSettingsState } from 'src/configure';
import { logout } from 'src/auth';
import { changeTheme, theme, ThemeName, themeNames } from 'src/theme';
import { i18n, langNames } from 'src/i18n';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/options';

const style = createCSSSheet(css`
  :host {
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
  }

  #onClick = (event: Event) => {
    const activeElement = event.target as HTMLElement;
    ContextMenu.open(
      [
        {
          text: i18n.get('setting'),
          handle: toggoleSettingsState,
          tag: getShortcut('OPEN_SETTINGS', true),
        },
        {
          text: i18n.get('discord'),
          handle: () => {
            window.open('https://discord.gg/hY6XkHwc');
          },
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
          handle: toggoleScreencaseMode,
        },
        {
          text: i18n.get('feedback'),
          handle: () => {
            window.open('https://github.com/mantou132/nesbox/issues');
          },
        },
        // {
        //   text: i18n.get('help'),
        //   handle: console.log,
        // },
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
      <dy-avatar class="avatar" src=${`https://joeschmoe.io/api/v1/${configure.user?.username}`}></dy-avatar>
    `;
  };
}
