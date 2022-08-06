import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { configure } from 'src/configure';
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
    grid-template-columns: 4fr 11fr;
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
 * @customElement m-keybinding
 */
@customElement('m-keybinding')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
@connectStore(configure)
export class MKeybindingElement extends GemElement {
  render = () => {
    if (!configure.user) return html``;

    const getJoypadKey = (keys: string[]) => keys.find((e) => e.length === 1 || e.startsWith('arrow')) || '';

    return html`
      <dy-heading class="heading" lv="4">${i18n.get('keySettingJoypad1')}</dy-heading>
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
      <dy-heading class="heading" lv="4">${i18n.get('keySettingJoypad2')}</dy-heading>
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
    `;
  };
}
