import {
  addListener,
  adoptedStyle,
  boolattribute,
  createRef,
  createState,
  css,
  customElement,
  GemElement,
  history,
  html,
  mounted,
} from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { isMtApp } from '@nesbox/mtapp';
import type { DuoyunFormElement } from 'duoyun-ui/elements/form';
import { createPath } from 'duoyun-ui/elements/route';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { gotoRedirectUri, isExpiredProfile } from 'src/auth';
import { configure } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { routes } from 'src/routes';
import { login, register } from 'src/services/guest-api';
import { theme } from 'src/theme';
import { getCDNSrc } from 'src/utils/common';

import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/action-text';
import 'src/elements/tooltip';
import 'src/modules/guest';

const bgUrl = getCDNSrc(
  'https://cdn.dribbble.com/users/870476/screenshots/10244007/media/ba3b0d812068691f20b835e7381284b1.jpg',
);

const style = css`
  :scope {
    position: relative;
    height: 0;
    flex-grow: 1;
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    color: ${theme.textColor};
    background: url(${bgUrl}) center center / cover no-repeat fixed;
  }
  .bg-copyright {
    position: fixed;
    inset: auto auto 1em 1em;
    font-size: 0.75em;
  }
  .slogan {
    min-width: 0;
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
    border-radius: ${theme.smallRound};
  }
  .slogan h1 {
    font-size: min(2.7em, 8vh);
    font-weight: bold;
    margin-block: -5vh 0.3em;
    padding-inline: 0.2em;
  }
  .slogan p {
    font-style: italic;
    font-size: min(1.6em, 5vh);
    line-height: 1.5;
    padding-inline: 0.2em 0.4em;
    margin-block-end: 4px;
    white-space: nowrap;
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    padding: 2em 1.6em;
    background: ${theme.backgroundColor};
    width: min(22em, 40vw);
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .header {
    font-size: min(2.7em, 8vh);
    margin-block: -5vh 1.2em;
  }
  .send {
    flex-grow: 0;
    font-variant-numeric: tabular-nums;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row-reverse;
    margin-block: min(3em, 5vh) 1em;
    gap: 1em;
    align-items: center;
  }
  dy-form-item::part(input) {
    font-size: 1em;
  }
  @media ${mediaQuery.PHONE} {
    :scope {
      background: none;
    }
    .bg-copyright,
    .slogan {
      display: none;
    }
    .content {
      width: 100%;
    }
    .actions * {
      width: 100%;
      text-align: center;
    }
    .header ~ * {
      font-size: 1.15em;
    }
  }
`;

@customElement('p-login')
@adoptedStyle(style)
export class PLoginElement extends GemElement {
  @boolattribute register: boolean;

  #formRef = createRef<DuoyunFormElement>();

  #state = createState({
    username: '',
    password: '',
    loading: false,
  });

  #goto = () => {
    if (this.register) {
      history.replace({ path: createPath(routes.login) });
    } else {
      history.replace({ path: createPath(routes.register) });
    }
  };

  #onChange = (evt: CustomEvent) => this.#state({ ...evt.detail });

  #onKeyDown = hotkeys({
    enter: async () => {
      const { username, password } = this.#state;
      const { value } = this.#formRef;
      if (!username) {
        value?.elements.username?.focus();
      } else if (!password) {
        value?.elements.password?.focus();
      } else {
        (this.shadowRoot?.activeElement as any)?.blur?.();
        try {
          await this.#onSubmit();
        } catch (err) {
          if (isMtApp) {
            setTimeout(() => {
              // re-enter
              this.#state({ username: '', password: '' });
            }, 1000);
          }
          throw err;
        }
      }
    },
  });

  #onSubmit = async () => {
    if (this.#state.loading) return;
    try {
      this.#state({ loading: true });
      if (!(await this.#formRef.value!.valid())) return;
      const { username, password } = this.#state;
      if (this.register) {
        await register({ username, password });
      } else {
        await login({ username, password, disableSso: mediaQuery.isPhone });
      }
    } finally {
      this.#state({ loading: false });
    }
    gotoRedirectUri();
  };

  @mounted()
  #init = () => {
    if (configure.profile && !isExpiredProfile(configure.profile)) {
      gotoRedirectUri();
    }
    return addListener(document, 'keydown', this.#onKeyDown);
  };

  render = () => {
    const { username, password, loading } = this.#state;
    return html`
      <div class="slogan">
        <h1>${i18n.get('global.slogan')}</h1>
        ${i18n
          .get('global.sloganDesc')
          .split('\n')
          .map((line) => html`<p>${line}</p>`)}
      </div>
      <div class="content">
        <dy-heading lv="1" class="header">${this.register ? routes.register.title : routes.login.title}</dy-heading>
        <dy-form  ${this.#formRef} class="form"  @change=${this.#onChange}>
          <dy-form-item
            name="username"
            required
            .placeholder=${i18n.get('placeholder.username')}
            .value=${username}
          ></dy-form-item>
          <dy-form-item
            type="password"
            name="password"
            required
            .placeholder=${i18n.get('placeholder.password')}
            .value=${password}
          ></dy-form-item>
        </dy-form>
        <div class="actions">
          <dy-button data-cy="submit" @click=${this.#onSubmit} .icon=${loading ? icons.loading : undefined}>
            ${loading ? '' : this.register ? i18n.get('page.login.register') : i18n.get('menu.account.login')}
          </dy-button>
          <dy-action-text @click=${this.#goto} ?hidden=${isMtApp}>
            ${this.register ? i18n.get('page.login.goLogin') : i18n.get('page.login.goRegister')}
          </dy-action-text>
        </div>
      </div>
      <m-guest ?hidden=${isMtApp || mediaQuery.isPhone}></m-guest>
      <div class="bg-copyright">
        <nesbox-tooltip .content=${i18n.get('tooltip.login.imgCopyright')}>
          <dy-link @click=${() => open('https://dribbble.com/shots/10244007-Old-tech-devices-2')}>
            @Tanner Wayment
          </dy-link>
        </nesbox-tooltip>
      </div>
    `;
  };
}
