import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { theme } from 'duoyun-ui/lib/theme';
import { icons } from 'duoyun-ui/lib/icons';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import type { GemUseElement } from '@mantou/gem/elements/use';

import { i18n, langNames } from 'src/i18n';
import { ThemeName, themeNames, changeTheme } from 'src/theme';
import { configure, toggoleScreencaseMode } from 'src/configure';

import '@mantou/gem/elements/use';
import 'duoyun-ui/elements/input-capture';

const style = createCSSSheet(css`
  .menu {
    position: fixed;
    inset-inline-end: 1em;
    inset-block-start: 1em;
    width: 1.5em;
    padding: 4px;
    border-radius: ${theme.normalRound};
  }
  .menu:where(:hover, :--active, [data-active]) {
    background-color: ${theme.hoverBackgroundColor};
  }
`);

/**
 * @customElement m-guest
 */
@customElement('m-guest')
@adoptedStyle(style)
@connectStore(configure)
export class ModuleGuestElement extends GemElement {
  #openMenu = ({ target }: MouseEvent) => {
    const btn = target as GemUseElement;
    ContextMenu.open(
      [
        {
          text: i18n.get('sidebarLanguage'),
          menu: Object.keys(i18n.resources).map((code) => ({
            selected: i18n.currentLanguage === code,
            text: langNames[code],
            handle: () => waitLoading(i18n.setLanguage(code)),
          })),
        },
        {
          text: i18n.get('sidebarTheme'),
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
      ],
      {
        activeElement: btn,
      },
    );
  };

  render = () => {
    return html`
      <gem-use
        tabindex="0"
        role="button"
        aria-label="Preference"
        class="menu"
        @click=${this.#openMenu}
        @keydown=${commonHandle}
        .element=${icons.more}
      ></gem-use>
      ${configure.screencastMode ? html`<dy-input-capture></dy-input-capture>` : ''}
    `;
  };
}
