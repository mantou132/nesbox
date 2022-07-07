import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { isMac } from 'duoyun-ui/lib/hotkeys';

import { configure, Settings } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/shortcut-record';

export const gridStyle = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;
  }
  .grid {
    display: grid;
    grid-template-columns: 2fr 6fr;
    gap: 0.75em;
  }
  .grid div {
    display: flex;
    align-items: center;
  }
`);

/**
 * @customElement m-keybinding
 */
@customElement('m-keybinding')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
@connectStore(configure)
export class MKeybindingElement extends GemElement {
  render = () => {
    if (!configure.user) return html``;

    const labelMap: Record<keyof Settings['shortcuts'], string> = {
      OPEN_SEARCH: '搜索',
      OPEN_SETTINGS: '设置',
      SAVE_GAME_STATE: '保存状态',
      LOAD_GAME_STATE: '恢复状态',
    };

    const getJoypadKey = (keys: string[]) => keys.find((e) => e.length === 1 || e.startsWith('arrow')) || '';

    return html`
      <dy-heading class="heading" lv="4">Joypad 1</dy-heading>
      <div class="grid">
        ${Object.entries(configure.user.settings.keybinding)
          .filter(([name]) => !name.endsWith('_2'))
          .map(
            ([name, value]) => html`
              <div>${name}</div>
              <dy-shortcut-record
                .value=${value ? [value] : undefined}
                @change=${({ detail }: CustomEvent<string[]>) =>
                  updateAccount({
                    settings: {
                      ...configure.user!.settings,
                      keybinding: {
                        ...configure.user!.settings.keybinding,
                        [name]: getJoypadKey(detail),
                      },
                    },
                  })}
              ></dy-shortcut-record>
            `,
          )}
      </div>
      <dy-heading class="heading" lv="4">Joypad 2</dy-heading>
      <div class="grid">
        ${Object.entries(configure.user.settings.keybinding)
          .filter(([name]) => name.endsWith('_2'))
          .map(
            ([name, value]) => html`
              <div>${name.replace('_2', '')}</div>
              <dy-shortcut-record
                .value=${value ? [value] : undefined}
                @change=${({ detail }: CustomEvent<string[]>) =>
                  updateAccount({
                    settings: {
                      ...configure.user!.settings,
                      keybinding: {
                        ...configure.user!.settings.keybinding,
                        [name]: getJoypadKey(detail),
                      },
                    },
                  })}
              ></dy-shortcut-record>
            `,
          )}
      </div>
      <dy-heading class="heading" lv="4">快捷键</dy-heading>
      <div class="grid">
        ${Object.entries(configure.user.settings.shortcuts).map(
          ([name, key]) => html`
            <div>${labelMap[name as keyof Settings['shortcuts']]}</div>
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
  };
}
