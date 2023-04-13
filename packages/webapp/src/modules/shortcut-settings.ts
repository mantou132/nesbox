import { GemElement, html, adoptedStyle, customElement, connectStore, createCSSSheet, css } from '@mantou/gem';
import { isMac } from 'duoyun-ui/lib/hotkeys';

import { configure, Settings } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/shortcut-record';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/tooltip';

type SettingsKey = keyof Settings['shortcuts'];
type LabelMap = { [K in SettingsKey]?: string };

export const gridStyle = createCSSSheet(css`
  :host {
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
`);

/**
 * @customElement m-shortcut-settings
 */
@customElement('m-shortcut-settings')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
@connectStore(configure)
export class MShortcutSettingsElement extends GemElement {
  render = () => {
    if (!configure.user) return html``;

    const labelMap: LabelMap = {
      OPEN_SEARCH: i18n.get('shortcutSearch'),
      OPEN_HELP: i18n.get('shortcutHelp'),
      OPEN_SETTINGS: i18n.get('shortcutSettings'),
      QUICK_REPLY: i18n.get('shortcutReadMsg'),
      ROOM_SPEECH: 'Voice Input',
    };

    const labelMap2: LabelMap = {
      SCREENSHOT: i18n.get('shortcutScreenshot'),
      SAVE_GAME_STATE: i18n.get('shortcutSave'),
      LOAD_GAME_STATE: i18n.get('shortcutLoad'),
      OPEN_RAM_VIEWER: i18n.get('shortcutOpenRam'),
      OPEN_CHEAT_SETTINGS: i18n.get('shortcutOpenCheat'),
    };

    const render = (labelMap: LabelMap, onlyHost?: (key: SettingsKey) => boolean) => html`
      <div class="grid">
        ${Object.entries(configure.user!.settings.shortcuts).map(
          ([name, key]) =>
            labelMap[name as SettingsKey] &&
            html`
              <div>
                ${labelMap[name as SettingsKey]}
                ${onlyHost?.(name as SettingsKey)
                  ? html`
                      <dy-tooltip .content=${i18n.get('tipHostSetting')}>
                        <dy-use class="help" .element=${icons.help}></dy-use>
                      </dy-tooltip>
                    `
                  : ''}
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
      <dy-heading class="heading" lv="4">${i18n.get('shortcutGlobal')}</dy-heading>
      ${render(labelMap)}
      <dy-heading class="heading" lv="4">${i18n.get('shortcutInGame')}</dy-heading>
      ${render(labelMap2, (name) => name !== 'SCREENSHOT')}
    `;
  };
}
