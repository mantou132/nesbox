import { adoptedStyle, connectStore, css, customElement, GemElement, html } from '@mantou/gem';
import { isMac } from 'duoyun-ui/lib/hotkeys';
import { configure, type Settings } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { updateAccount } from 'src/services/api';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/shortcut-record';
import 'duoyun-ui/elements/tooltip';

type SettingsKey = keyof Settings['shortcuts'];
type LabelMap = { [K in SettingsKey]?: string };

export const gridStyle = css`
  :scope {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;
  }
  .grid {
    display: grid;
    grid-template-columns: 5fr 11fr;
    gap: 0.75em;
    width: 100%;
  }
  .grid div {
    display: flex;
    align-items: center;
  }
  .help {
    width: 1em;
  }
`;

@customElement('m-shortcut-settings')
@adoptedStyle(gridStyle)
@connectStore(configure)
export class MShortcutSettingsElement extends GemElement {
  render = () => {
    if (!configure.user) return null;

    const globalShortcutLabelMap: LabelMap = {
      OPEN_SEARCH: i18n.get('settings.shortcut.search'),
      OPEN_HELP: i18n.get('settings.shortcut.openHelp'),
      OPEN_SETTINGS: i18n.get('settings.shortcut.settings'),
      QUICK_REPLY: i18n.get('settings.shortcut.readMsg'),
      ROOM_SPEECH: i18n.get('settings.shortcut.voiceInput'),
    };

    const gameShortcutLabelMap2: LabelMap = {
      SCREENSHOT: i18n.get('menu.game.screenshot'),
      SAVE_GAME_STATE: i18n.get('menu.game.stateSave'),
      LOAD_GAME_STATE: i18n.get('menu.game.loadState'),
      OPEN_RAM_VIEWER: i18n.get('menu.game.openRam'),
      OPEN_CHEAT_SETTINGS: i18n.get('menu.game.openCheat'),
    };

    const render = (labelMap: LabelMap, onlyHost?: (key: SettingsKey) => boolean) => html`
      <div class="grid">
        ${Object.entries(configure.user!.settings.shortcuts).map(
          ([name, key]) =>
            labelMap[name as SettingsKey] &&
            html`
              <div>
                ${labelMap[name as SettingsKey]}
                <dy-tooltip v-if=${!!onlyHost?.(name as SettingsKey)} .content=${i18n.get('tooltip.settings.onlyHost')}>
                  <dy-use class="help" .element=${icons.help}></dy-use>
                </dy-tooltip>
              </div>
              <dy-shortcut-record
                .value=${isMac ? key.mac : key.win}
                @change=${({ detail }: CustomEvent<string[]>) => {
                  updateAccount({
                    settings: {
                      ...configure.user!.settings,
                      shortcuts: {
                        ...configure.user!.settings.shortcuts,
                        [name]: {
                          ...key,
                          [isMac ? 'mac' : 'win']: detail,
                        },
                      },
                    },
                  });
                }}
              ></dy-shortcut-record>
            `,
        )}
      </div>
    `;

    return html`
      <dy-heading class="heading" lv="4">${i18n.get('settings.shortcut.global')}</dy-heading>
      ${render(globalShortcutLabelMap)}
      <dy-heading class="heading" lv="4">${i18n.get('settings.shortcut.inGame')}</dy-heading>
      ${render(gameShortcutLabelMap2, (name) => name !== 'SCREENSHOT')}
    `;
  };
}
