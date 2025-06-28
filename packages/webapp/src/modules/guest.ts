import { adoptedStyle, connectStore, css, customElement, GemElement, html } from '@mantou/gem';
import type { GemUseElement } from '@mantou/gem/elements/use';
import { ContextMenu } from 'duoyun-ui/elements/contextmenu';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { icons } from 'duoyun-ui/lib/icons';
import { focusStyle } from 'duoyun-ui/lib/styles';
import { configure, toggleScreencastMode } from 'src/configure';
import { i18n, langNames } from 'src/i18n/basic';
import { changeTheme, type ThemeName, theme, themeNames } from 'src/theme';

import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/use';

const style = css`
  .menu {
    position: absolute;
    inset-inline-end: 1em;
    inset-block-start: 1em;
    width: 1.5em;
    padding: 4px;
    border-radius: ${theme.normalRound};
  }
  .menu:where(:hover, :state(active)) {
    background-color: ${theme.hoverBackgroundColor};
  }
`;

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
      <dy-input-capture v-if=${!!configure.screencastMode}></dy-input-capture>
    `;
  };
}
