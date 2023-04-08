import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  refobject,
  RefObject,
} from '@mantou/gem';
import { throttle } from 'duoyun-ui/lib/utils';
import { locale } from 'duoyun-ui/lib/locale';
import { Toast } from 'duoyun-ui/elements/toast';

import { configure } from 'src/configure';
import { updateAccount, updatePassword } from 'src/services/api';
import { i18n } from 'src/i18n/basic';

import type { DuoyunFormElement } from 'duoyun-ui/elements/form';

import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/heading';

const style = createCSSSheet(css`
  .form {
    width: min(20em, 100%);
  }
  .heading {
    margin-block: 3em 1em;
  }
`);

type State = {
  oldpassword: string;
  password: string;
  renewpassword: string;
};

/**
 * @customElement m-account-settings
 */
@customElement('m-account-settings')
@adoptedStyle(style)
@connectStore(configure)
export class MAccountSettingsElement extends GemElement<State> {
  @refobject formRef: RefObject<DuoyunFormElement>;

  state: State = {
    oldpassword: '',
    password: '',
    renewpassword: '',
  };

  #throttleUpdateAccount = throttle(updateAccount);

  #onNicknameChange = ({ detail, target }: CustomEvent<{ name: string; value: string }>) => {
    (target as HTMLInputElement).value = detail.value;
    this.#throttleUpdateAccount({ [detail.name]: detail.value });
  };

  #onChangePassword = async () => {
    if (!(await this.formRef.element?.valid())) return;
    await updatePassword({
      oldpassword: this.state.oldpassword,
      password: this.state.password,
    });
    this.setState({ oldpassword: '', password: '', renewpassword: '' });
    Toast.open('success', i18n.get('tipChangePassword'));
  };

  render = () => {
    return html`
      <dy-form class="form">
        <dy-form-item
          label=${i18n.get('nickname')}
          name="nickname"
          .value=${configure.user?.nickname}
          @itemchange=${this.#onNicknameChange}
        ></dy-form-item>
      </dy-form>
      <dy-form
        class="form"
        ref=${this.formRef.ref}
        @change=${({ detail }: CustomEvent<State>) => this.setState(detail)}
      >
        <dy-heading class="heading" lv="4">${i18n.get('changePassword')}</dy-heading>
        <dy-form-item
          label=${i18n.get('oldpassword')}
          type="password"
          name="oldpassword"
          .value=${this.state.oldpassword}
        ></dy-form-item>
        <dy-form-item
          label=${i18n.get('newpassword')}
          type="password"
          name="password"
          .value=${this.state.password}
        ></dy-form-item>
        <dy-form-item
          label=${i18n.get('renewpassword')}
          type="password"
          name="renewpassword"
          .rules=${[
            {
              validator: () => {
                if (this.state.password !== this.state.renewpassword) {
                  throw new Error(i18n.get('renewpasswordNotMatch'));
                }
              },
            },
          ]}
          .value=${this.state.renewpassword}
        ></dy-form-item>
        <dy-button @click=${this.#onChangePassword}>${locale.ok}</dy-button>
      </dy-form>
    `;
  };
}
