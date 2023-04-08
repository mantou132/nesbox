import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { icons } from 'duoyun-ui/lib/icons';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { focusStyle } from 'duoyun-ui/lib/styles';

import { i18n, langNames } from 'src/i18n/basic';
import { ThemeName, themeNames, changeTheme, theme } from 'src/theme';
import { configure, toggleScreencastMode } from 'src/configure';

import type { GemUseElement } from '@mantou/gem/elements/use';

import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  .menu {
    position: absolute;
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
@adoptedStyle(focusStyle)
@connectStore(configure)
export class ModuleGuestElement extends GemElement {
  #openMenu = ({ target }: MouseEvent) => {
    const btn = target as GemUseElement;
    ContextMenu.open(
      [
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
      ],
      {
        activeElement: btn,
      },
    );
  };

  render = () => {
    return html`
      <dy-use
        tabindex="0"
        role="button"
        aria-label="Preference"
        class="menu"
        @click=${this.#openMenu}
        @keydown=${commonHandle}
        .element=${icons.more}
      ></dy-use>
      ${configure.screencastMode ? html`<dy-input-capture></dy-input-capture>` : ''}
    `;
  };
}
