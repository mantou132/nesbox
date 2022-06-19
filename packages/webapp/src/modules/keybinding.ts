import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { configure } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/shortcut-record';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 4fr;
    gap: 0.5em;
  }
`);

/**
 * @customElement m-keybinding
 */
@customElement('m-keybinding')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(configure)
export class MKeybindingElement extends GemElement {
  render = () => {
    if (!configure.user) return html``;
    return html`
      <dy-heading class="heading" lv="4">Joypad 1</dy-heading>
      <div class="grid">
        ${Object.entries(configure.user.settings.keybinding)
          .filter(([name]) => !name.endsWith('_2'))
          .map(
            ([name, key]) => html`
              <div>${name}</div>
              <dy-shortcut-record
                .value=${[key]}
                @change=${({ detail }: CustomEvent<string[]>) =>
                  detail.length === 1 &&
                  updateAccount({
                    settings: {
                      ...configure.user!.settings,
                      keybinding: {
                        ...configure.user!.settings.keybinding,
                        [name]: detail[0],
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
            ([name, key]) => html`
              <div>${name.replace('_2', '')}</div>
              <dy-shortcut-record
                .value=${[key]}
                @change=${({ detail }: CustomEvent<string[]>) =>
                  detail.length === 1 &&
                  updateAccount({
                    settings: {
                      ...configure.user!.settings,
                      keybinding: {
                        ...configure.user!.settings.keybinding,
                        [name]: detail[0],
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
