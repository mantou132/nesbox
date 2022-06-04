import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  styleMap,
} from '@mantou/gem';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { Toast } from 'duoyun-ui/elements/toast';
import { waitLoading } from 'duoyun-ui/elements/wait';

import { configure, getShortcut, toggoleScreencaseMode, toggoleSettingsState } from 'src/configure';
import { logout } from 'src/auth';
import { changeTheme, theme, ThemeName, themeNames } from 'src/theme';
import { icons } from 'src/icons';
import { i18n, langNames } from 'src/i18n';

import 'duoyun-ui/elements/help-text';
import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/options';
import 'duoyun-ui/elements/use';

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
    ContextMenu.open(
      [
        {
          text: html`
            <dy-help-text style=${styleMap({ fontSize: '1em' })}>
              ${i18n.get('profileItem', `${configure.user?.username}`)}
            </dy-help-text>
          `,
          tag: html`<dy-use style=${styleMap({ width: '1.2em' })} .element=${icons.copy}></dy-use>`,
          handle: async () => {
            try {
              await navigator.clipboard.writeText(String(configure.user?.username));
              Toast.open('success', '成功复制用户 ID');
            } catch (err) {
              Toast.open('error', err?.message || err);
            }
          },
        },
        {
          text: i18n.get('profileSetting'),
          handle: toggoleSettingsState,
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
          handle: toggoleScreencaseMode,
        },
        {
          text: i18n.get('help'),
          handle: console.log,
          tag: getShortcut('OPEN_HELP', true),
        },
        {
          text: '---',
        },
        {
          text: i18n.get('logout'),
          danger: true,
          handle: logout,
        },
      ],
      {
        activeElement: event.target as HTMLElement,
      },
    );
  };

  render = () => {
    return html`
      <dy-avatar class="avatar" src=${`https://joeschmoe.io/api/v1/${configure.user?.username}`}></dy-avatar>
    `;
  };
}
