import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { icons } from 'duoyun-ui/lib/icons';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import type { GemUseElement } from '@mantou/gem/elements/use';

import { i18n, langNames } from 'src/i18n';
import { ThemeName, themeNames, changeTheme, theme } from 'src/theme';
import { configure, toggoleScreencaseMode } from 'src/configure';
import { NesboxWaitElement } from 'src/elements/wait';

import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/use';

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
          text: i18n.get('changeLanguage'),
          menu: Object.keys(i18n.resources).map((code) => ({
            selected: i18n.currentLanguage === code,
            text: langNames[code],
            handle: () => NesboxWaitElement.wait(i18n.setLanguage(code)),
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
