import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';
import { throttle } from 'duoyun-ui/lib/utils';

import { configure } from 'src/configure';
import { i18n } from 'src/i18n';
import { gridStyle } from 'src/modules/keybinding';
import { updateAccount } from 'src/services/api';
import { playSound } from 'src/utils';

import 'duoyun-ui/elements/slider';

/**
 * @customElement m-sound-settings
 */
@customElement('m-sound-settings')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
export class MSoundSettingsElement extends GemElement {
  #throttleUpdateVolume = throttle(async (name: string, value: number) => {
    await updateAccount({
      settings: {
        ...configure.user!.settings,
        volume: {
          ...configure.user!.settings.volume,
          [name]: value,
        },
      },
    });
    playSound('', value);
  });

  render = () => {
    if (!configure.user) return html``;

    const volumeLabelMap: Record<string, string> = {
      notification: i18n.get('notificationVolume'),
      game: '游戏',
    };

    return html`
      <dy-heading class="heading" lv="4">${i18n.get('volumeSetting')}</dy-heading>
      <div class="grid">
        ${Object.entries(configure.user.settings.volume).map(
          ([name, value]) => html`
            <div>${volumeLabelMap[name]}</div>
            <dy-slider
              .value=${value * 100}
              @change=${(evt: CustomEvent<number>) => {
                if (Math.round(value * 100) !== evt.detail) {
                  (evt.target as any).value = evt.detail;
                  this.#throttleUpdateVolume(name, evt.detail / 100);
                }
              }}
            ></dy-slider>
          `,
        )}
      </div>
    `;
  };
}
