import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';
import { isMac } from 'duoyun-ui/lib/hotkeys';

import { configure, Settings } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n';
import { gridStyle } from 'src/modules/keybinding';

import 'duoyun-ui/elements/shortcut-record';
import 'duoyun-ui/elements/heading';

type SettingsKey = keyof Settings['shortcuts'];
type LabelMap = { [K in SettingsKey]?: string };

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
      OPEN_SETTINGS: i18n.get('shortcutSettings'),
      QUICK_REPLY: i18n.get('shortcutReadMsg'),
    };

    const labelMap2: LabelMap = {
      SAVE_GAME_STATE: i18n.get('shortcutSave'),
      LOAD_GAME_STATE: i18n.get('shortcutLoad'),
    };

    const render = (labelMap: LabelMap) => html`
      <div class="grid">
        ${Object.entries(configure.user!.settings.shortcuts).map(
          ([name, key]) =>
            labelMap[name as SettingsKey] &&
            html`
              <div>${labelMap[name as SettingsKey]}</div>
              <dy-shortcut-record
                .value=${isMac ? key.mac : key.win}
                @change=${({ detail }: CustomEvent<string[]>) =>
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
                  })}
              ></dy-shortcut-record>
            `,
        )}
      </div>
    `;

    return html`
      <dy-heading class="heading" lv="4">${i18n.get('shortcutGlobal')}</dy-heading>
      ${render(labelMap)}
      <dy-heading class="heading" lv="4">${i18n.get('shortcutHost')}</dy-heading>
      ${render(labelMap2)}
    `;
  };
}
