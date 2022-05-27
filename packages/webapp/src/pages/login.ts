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
  boolattribute,
  history,
} from '@mantou/gem';
import type { DuoyunFormElement } from 'duoyun-ui/elements/form';
import { createPath } from 'duoyun-ui/elements/route';

import { theme } from 'src/theme';
import { gotoRedirectUri } from 'src/auth';
import { i18n } from 'src/i18n';
import { routes } from 'src/routes';
import { login, register } from 'src/services/guest-api';

import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/action-text';
import 'src/elements/tooltip';
import 'src/modules/guest';

const style = createCSSSheet(css`
  :host {
    display: flex;
    height: 100%;
    align-items: stretch;
    justify-content: flex-end;
    color: ${theme.textColor};
    background: url(https://cdn.dribbble.com/users/870476/screenshots/10244007/media/ba3b0d812068691f20b835e7381284b1.jpg)
      center center / cover no-repeat fixed;
  }
  .bg-copyright {
    position: fixed;
    inset: auto auto 1em 1em;
    font-size: 0.75em;
  }
  .slogan {
    flex-grow: 1;
    display: flex;
    padding-inline: 10vw;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
  .slogan * {
    margin: 0;
    background-color: ${theme.backgroundColor};
    color: ${theme.highlightColor};
    vertical-align: middle;
    padding-inline: 0.2em 0.4em;
  }
  .slogan h1 {
    font-size: 2.7em;
    font-weight: bold;
    margin-block: -2em 0.3em;
  }
  .slogan p {
    font-style: italic;
    font-size: 1.6em;
    line-height: 1.5;
    margin-block-end: 4px;
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    padding: 2em 1.6em;
    background: ${theme.backgroundColor};
  }
  .header {
    margin-block: -10vh 1.2em;
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
  @boolattribute register: boolean;

  state: State = {
    username: '',
    password: '',
  };

  #goto = () => {
    if (this.register) {
      history.replace({ path: createPath(routes.login) });
    } else {
      history.replace({ path: createPath(routes.register) });
    }
  };

  #onChange = (evt: CustomEvent<State>) => this.setState({ ...evt.detail });

  #onSubmit = async () => {
    if (!(await this.formRef.element!.valid())) return;
    const { username, password } = this.state;
    if (this.register) {
      await register({ username, password });
    } else {
      await login({ username, password });
    }
    gotoRedirectUri();
  };

  render = () => {
    const { username, password } = this.state;
    return html`
      <m-guest></m-guest>
      <div class="bg-copyright">
        <nesbox-tooltip .content=${i18n.get('bgCopyright')}>
          <dy-link href="https://dribbble.com/shots/10244007-Old-tech-devices-2">@Tanner Wayment</dy-link>
        </nesbox-tooltip>
      </div>
      <div class="slogan">
        <h1>${i18n.get('slogan')}</h1>
        ${i18n
          .get('sloganDesc')
          .split('\n')
          .map((line) => html`<p>${line}</p>`)}
      </div>
      <div class="content">
        <dy-heading lv="1" class="header">${this.register ? routes.register.title : routes.login.title}</dy-heading>
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
          <dy-button @click=${this.#onSubmit}>${this.register ? i18n.get('register') : i18n.get('login')}</dy-button>
          <dy-action-text @click=${this.#goto}>
            ${this.register ? i18n.get('goLogin') : i18n.get('goRegister')}
          </dy-action-text>
        </div>
      </div>
    `;
  };
}