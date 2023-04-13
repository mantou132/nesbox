import { GemElement, html, customElement, connectStore, css, createCSSSheet, adoptedStyle } from '@mantou/gem';
import { Toast } from 'duoyun-ui/elements/toast';

import { configure, defaultKeybinding, Settings } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n/basic';

import type { GamePadValue } from 'src/elements/gamepad';

import 'duoyun-ui/elements/shortcut-record';
import 'duoyun-ui/elements/button';
import 'src/elements/gamepad';

const style = createCSSSheet(css`
  .header {
    display: flex;
    gap: 1em;
    align-items: center;
  }
  dy-heading {
    margin: 0;
  }
`);

/**
 * @customElement m-keybinding
 */
@customElement('m-keybinding')
@connectStore(i18n.store)
@adoptedStyle(style)
@connectStore(configure)
export class MKeybindingElement extends GemElement {
  #updateKeybinding = (keybinding: Settings['keybinding']) => {
    const values = Object.values(keybinding);
    if (values.length !== new Set(values).size) {
      Toast.open('warning', i18n.get('tipKeybindingExist'));
    }
    updateAccount({
      settings: {
        ...configure.user!.settings,
        keybinding,
      },
    });
  };

  render = () => {
    if (!configure.user) return html``;
    const { keybinding } = configure.user.settings;

    return html`
      <div class="header">
        <dy-heading class="heading" lv="4"> ${i18n.get('keySettingJoypad1')} </dy-heading>
        <dy-button
          small
          @click=${() => {
            this.#updateKeybinding({
              ...keybinding,
              Up: defaultKeybinding.Up,
              Left: defaultKeybinding.Left,
              Down: defaultKeybinding.Down,
              Right: defaultKeybinding.Right,
              A: defaultKeybinding.A,
              B: defaultKeybinding.B,
              C: defaultKeybinding.C,
              TurboA: defaultKeybinding.TurboA,
              TurboB: defaultKeybinding.TurboB,
              TurboC: defaultKeybinding.TurboC,
              Select: defaultKeybinding.Select,
              Start: defaultKeybinding.Start,
              Reset: defaultKeybinding.Reset,
            });
          }}
          >Reset</dy-button
        >
      </div>
      <nesbox-gamepad
        .value=${{
          Up: keybinding.Up,
          Left: keybinding.Left,
          Down: keybinding.Down,
          Right: keybinding.Right,
          A: keybinding.A,
          B: keybinding.B,
          C: keybinding.C,
          TurboA: keybinding.TurboA,
          TurboB: keybinding.TurboB,
          TurboC: keybinding.TurboC,
          Select: keybinding.Select,
          Start: keybinding.Start,
          Reset: keybinding.Reset,
        }}
        @change=${({ detail }: CustomEvent<GamePadValue>) =>
          this.#updateKeybinding({
            ...keybinding,
            ...detail,
          })}
      ></nesbox-gamepad>

      <div class="header">
        <dy-heading class="heading" lv="4"> ${i18n.get('keySettingJoypad2')} </dy-heading>
        <dy-button
          small
          @click=${() => {
            this.#updateKeybinding({
              ...keybinding,
              Up_2: defaultKeybinding.Up_2,
              Left_2: defaultKeybinding.Left_2,
              Down_2: defaultKeybinding.Down_2,
              Right_2: defaultKeybinding.Right_2,
              A_2: defaultKeybinding.A_2,
              B_2: defaultKeybinding.B_2,
              C_2: defaultKeybinding.C_2,
              TurboA_2: defaultKeybinding.TurboA_2,
              TurboB_2: defaultKeybinding.TurboB_2,
              TurboC_2: defaultKeybinding.TurboC_2,
            });
          }}
          >Reset</dy-button
        >
      </div>
      <nesbox-gamepad
        .value=${{
          Up: keybinding.Up_2,
          Left: keybinding.Left_2,
          Down: keybinding.Down_2,
          Right: keybinding.Right_2,
          A: keybinding.A_2,
          B: keybinding.B_2,
          C: keybinding.C_2,
          TurboA: keybinding.TurboA_2,
          TurboB: keybinding.TurboB_2,
          TurboC: keybinding.TurboC_2,
          Select: '',
          Start: '',
          Reset: '',
        }}
        @change=${({ detail }: CustomEvent<GamePadValue>) =>
          this.#updateKeybinding({
            ...keybinding,
            Up_2: detail.Up,
            Left_2: detail.Left,
            Down_2: detail.Down,
            Right_2: detail.Right,
            A_2: detail.A,
            B_2: detail.B,
            C_2: detail.C,
            TurboA_2: detail.TurboA,
            TurboB_2: detail.TurboB,
            TurboC_2: detail.TurboC,
          })}
      ></nesbox-gamepad>
    `;
  };
}
