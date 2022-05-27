import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { configure } from 'src/configure';
import { updateAccount } from 'src/services/api';

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
@connectStore(configure)
export class MKeybindingElement extends GemElement {
  render = () => {
    if (!configure.user) return html``;
    return html`
      <div class="grid">
        ${Object.entries(configure.user.settings.keybinding).map(
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
    `;
  };
}
