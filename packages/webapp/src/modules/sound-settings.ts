import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';
import { playSound } from 'src/utils';

import { configure, Settings } from 'src/configure';
import { i18n } from 'src/i18n';
import { gridStyle } from 'src/modules/shortcut-settings';
import { updateAccount } from 'src/services/api';

import 'duoyun-ui/elements/slider';

/**
 * @customElement m-sound-settings
 */
@customElement('m-sound-settings')
@adoptedStyle(gridStyle)
@connectStore(i18n.store)
export class MSoundSettingsElement extends GemElement {
  #updateVolume = (name: string, value: number) => {
    updateAccount({
      settings: {
        ...configure.user!.settings,
        volume: {
          ...configure.user!.settings.volume,
          [name]: value,
        },
      },
    });
    playSound('', value);
  };

  render = () => {
    if (!configure.user) return html``;

    const volumeLabelMap: Record<keyof Settings['volume'], string> = {
      hint: i18n.get('hintVolume'),
      notification: i18n.get('notificationVolume'),
      game: i18n.get('gameVolume'),
    };

    return html`
      <dy-heading class="heading" lv="4">${i18n.get('volumeSetting')}</dy-heading>
      <div class="grid">
        ${Object.entries(configure.user.settings.volume).map(
          ([name, value]) => html`
            <div>${volumeLabelMap[name as keyof Settings['volume']]}</div>
            <dy-slider
              .value=${value * 100}
              @change=${(evt: CustomEvent<number>) => ((evt.target as any).value = evt.detail)}
              @end=${(evt: CustomEvent<number>) => this.#updateVolume(name, evt.detail / 100)}
            ></dy-slider>
          `,
        )}
      </div>
    `;
  };
}
