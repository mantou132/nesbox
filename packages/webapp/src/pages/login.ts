import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  refobject,
  RefObject,
  connectStore,
} from '@mantou/gem';
import type { DuoyunFormElement } from 'duoyun-ui/elements/form';
import { theme } from 'duoyun-ui/lib/theme';

import { gotoRedirectUri } from 'src/auth';
import { i18n } from 'src/i18n';
import { routes } from 'src/routes';
import { login } from 'src/services/guest-api';

import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/action-text';
import 'src/modules/guest';

const style = createCSSSheet(css`
  :host {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    color: ${theme.textColor};
    background: url(https://sso.duoyun.cn/auth/resources/b6dgr/login/keycloak/img/keycloak-bg.png) center center / cover
      no-repeat fixed;
    background-color: ${theme.hoverBackgroundColor};
  }
  .card {
    margin-block-start: -20vh;
    padding: 2em 3em;
    border-radius: ${theme.normalRound};
    background: ${theme.backgroundColor};
  }
  .header {
    margin-block: 0.5em 1.2em;
  }
  .form {
    width: 22em;
  }
  .send {
    flex-grow: 0;
    font-variant-numeric: tabular-nums;
  }
  .action {
    display: flex;
    flex-direction: row-reverse;
    margin-block: 3em 1em;
    gap: 1em;
    align-items: center;
  }
`);

type State = {
  username: string;
  password: string;
};
/**
 * @customElement p-login
 */
@customElement('p-login')
@adoptedStyle(style)
@connectStore(i18n.store)
export class PLoginElement extends GemElement<State> {
  @refobject formRef: RefObject<DuoyunFormElement>;

  state: State = {
    username: '',
    password: '',
  };

  #onChange = (evt: CustomEvent<State>) => this.setState({ ...evt.detail });

  #onSubmit = async () => {
    if (!(await this.formRef.element!.valid())) return;
    const { username, password } = this.state;
    await login({ username, password });

    gotoRedirectUri();
  };

  render = () => {
    const { username, password } = this.state;
    return html`
      <m-guest></m-guest>
      <div class="card">
        <dy-heading lv="2" class="header">${routes.login.title}</dy-heading>
        <dy-form class="form" ref=${this.formRef.ref} @change=${this.#onChange}>
          <dy-form-item name="username" required .placeholder=${i18n.get('username')} .value=${username}></dy-form-item>
          <dy-form-item
            type="password"
            name="password"
            required
            .placeholder=${i18n.get('password')}
            .value=${password}
          ></dy-form-item>
        </dy-form>
        <div class="action">
          <dy-button @click=${this.#onSubmit}>${i18n.get('login')}</dy-button>
        </div>
      </div>
    `;
  };
}
