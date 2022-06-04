import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { throttle } from 'duoyun-ui/lib/utils';

import { configure } from 'src/configure';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/form';

const style = createCSSSheet(css``);

/**
 * @customElement m-account-settings
 */
@customElement('m-account-settings')
@adoptedStyle(style)
@connectStore(configure)
export class MAccountSettingsElement extends GemElement {
  #throttleUpdateAccount = throttle(updateAccount);

  #onItemChange = ({ detail, target }: CustomEvent<{ name: string; value: string }>) => {
    (target as HTMLInputElement).value = detail.value;
    this.#throttleUpdateAccount({ [detail.name]: detail.value });
  };

  render = () => {
    return html`
      <dy-form>
        <dy-form-item
          label=${i18n.get('nickname')}
          name="nickname"
          .value=${configure.user?.nickname}
          @itemchange=${this.#onItemChange}
        ></dy-form-item>
      </dy-form>
    `;
  };
}
