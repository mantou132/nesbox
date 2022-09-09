import { GemElement, html, customElement, connectStore } from '@mantou/gem';
import { Toast } from 'duoyun-ui/elements/toast';

import { configure, Settings } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n';
import type { GamePadValue } from 'src/elements/gamepad';

import 'duoyun-ui/elements/shortcut-record';
import 'src/elements/gamepad';

/**
 * @customElement m-keybinding
 */
@customElement('m-keybinding')
@connectStore(i18n.store)
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
      <dy-heading class="heading" lv="4">${i18n.get('keySettingJoypad1')}</dy-heading>
      <nesbox-gamepad
        .value=${{
          Up: keybinding.Up,
          Left: keybinding.Left,
          Down: keybinding.Down,
          Right: keybinding.Right,
          A: keybinding.A,
          B: keybinding.B,
          TurboA: keybinding.TurboA,
          TurboB: keybinding.TurboB,
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
      <dy-heading class="heading" lv="4">${i18n.get('keySettingJoypad2')}</dy-heading>
      <nesbox-gamepad
        .value=${{
          Up: keybinding.Up_2,
          Left: keybinding.Left_2,
          Down: keybinding.Down_2,
          Right: keybinding.Right_2,
          A: keybinding.A_2,
          B: keybinding.B_2,
          TurboA: keybinding.TurboA_2,
          TurboB: keybinding.TurboB_2,
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
            TurboA_2: detail.TurboA,
            TurboB_2: detail.TurboB,
          })}
      ></nesbox-gamepad>
    `;
  };
}
