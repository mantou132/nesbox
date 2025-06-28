import { adoptedStyle, connectStore, createRef, createState, css, customElement, GemElement, html } from '@mantou/gem';
import type { DuoyunFormElement } from 'duoyun-ui/elements/form';
import { Toast } from 'duoyun-ui/elements/toast';
import { locale } from 'duoyun-ui/lib/locale';
import { throttle } from 'duoyun-ui/lib/timer';
import { configure } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { updateAccount, updatePassword } from 'src/services/api';

import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/heading';

const style = css`
  .form {
    width: min(20em, 100%);
  }
  .heading {
    margin-block: 3em 1em;
  }
`;

@customElement('m-account-settings')
@adoptedStyle(style)
@connectStore(configure)
export class MAccountSettingsElement extends GemElement {
  #formRef = createRef<DuoyunFormElement>();

  #state = createState({
    oldpassword: '',
    password: '',
    renewpassword: '',
  });

  #throttleUpdateAccount = throttle(updateAccount);

  #onNicknameChange = ({ detail, target }: CustomEvent<{ name: string; value: string }>) => {
    (target as HTMLInputElement).value = detail.value;
    this.#throttleUpdateAccount({ [detail.name]: detail.value });
  };

  #onChangePassword = async () => {
    if (!(await this.#formRef.value?.valid())) return;
    await updatePassword({
      oldpassword: this.#state.oldpassword,
      password: this.#state.password,
    });
    this.#state({ oldpassword: '', password: '', renewpassword: '' });
    Toast.open('success', i18n.get('tip.settings.passwordChanged'));
  };

  render = () => {
    return html`
      <dy-form class="form">
        <dy-form-item
          label=${i18n.get('settings.account.nickname')}
          name="nickname"
          .value=${configure.user?.nickname}
          @itemchange=${this.#onNicknameChange}
        ></dy-form-item>
      </dy-form>
      <dy-form
        ${this.#formRef}
        class="form"
        @change=${({ detail }: CustomEvent) => this.#state(detail)}
      >
        <dy-heading class="heading" lv="4">${i18n.get('settings.account.password')}</dy-heading>
        <dy-form-item
          label=${i18n.get('settings.account.oldpassword')}
          type="password"
          name="oldpassword"
          .value=${this.#state.oldpassword}
        ></dy-form-item>
        <dy-form-item
          label=${i18n.get('settings.account.newpassword')}
          type="password"
          name="password"
          .value=${this.#state.password}
        ></dy-form-item>
        <dy-form-item
          label=${i18n.get('settings.account.renewpassword')}
          type="password"
          name="renewpassword"
          .rules=${[
            {
              validator: () => {
                if (this.#state.password !== this.#state.renewpassword) {
                  throw new Error(i18n.get('tip.settings.renewPasswordNotMatch'));
                }
              },
            },
          ]}
          .value=${this.#state.renewpassword}
        ></dy-form-item>
        <dy-button @click=${this.#onChangePassword}>${locale.ok}</dy-button>
      </dy-form>
    `;
  };
}
