import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  classMap,
  attribute,
  connectStore,
  titleStore,
} from '@mantou/gem';

import 'duoyun-ui/elements/title';
import 'duoyun-ui/elements/reflect';
import 'duoyun-ui/elements/use';

const minimize = `<svg viewBox="0 0 10.2 1" fill="currentColor"><rect x="0" y="50%" width="10.2" height="1" /></svg>`;
const maximize = `<svg viewBox="0 0 10 10" fill="currentColor"><path d="M0,0v10h10V0H0z M9,9H1V1h8V9z" /></svg>`;
const unmaximize = `<svg viewBox="0 0 10.2 10.1" fill="currentColor"><path d="M2.1,0v2H0v8.1h8.2v-2h2V0H2.1z M7.2,9.2H1.1V3h6.1V9.2z M9.2,7.1h-1V2H3.1V1h6.1V7.1z" /></svg>`;
const close = `<svg viewBox="0 0 10 10" fill="currentColor"><polygon points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1" /></svg>`;

export const closeListenerSet = new Set<() => void | Promise<void>>();

const style = createCSSSheet(css`
  :host {
    cursor: default;
    -webkit-user-select: none;
    user-select: none;
    display: flex;
    align-items: center;
    height: var(--titlebar-area-height, 0);
    font-size: 0.75em;
    background: black;
    color: white;
    z-index: 2147483647;
    justify-content: center;
  }
  :host([type='win']) {
    justify-content: space-between;
  }
  .title {
    padding-inline: 1em;
    font-weight: 500;
  }
  .buttons {
    display: flex;
    height: 100%;
    margin-inline-end: 1px;
  }
  .blur {
    opacity: 0.5;
  }
  .buttons * {
    width: 10px;
    padding: 0em 19px;
  }
  .buttons *:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .close:hover {
    background-color: #e81123;
  }
`);

type State = {
  fullscreen: boolean;
  maximized: boolean;
  blur: boolean;
};

/**
 * @customElement m-titlebar
 * @attr type
 * @attr header
 */
@customElement('m-titlebar')
@adoptedStyle(style)
@connectStore(titleStore)
export class MTitlebarElement extends GemElement<State> {
  @attribute header: string;
  @attribute type: 'win' | 'mac';

  state: State = {
    fullscreen: false,
    maximized: false,
    blur: false,
  };

  get #type() {
    return this.type || 'mac';
  }

  get #isWin() {
    return this.#type === 'win';
  }

  get #window() {
    return window.__TAURI__?.window.getCurrent();
  }

  #onResize = async () => {
    const maximized = await this.#window?.isMaximized();
    // https://github.com/tauri-apps/tauri/issues/4519
    this.setState({ maximized, fullscreen: innerWidth === screen.width && innerHeight === screen.height });
  };

  #toggleMaximize = () => {
    this.#window?.toggleMaximize();
  };

  constructor() {
    super();
    this.addEventListener('mousedown', (event) => {
      this.#window?.startDragging();
      // https://github.com/tauri-apps/tauri/issues/4059#issuecomment-1154360504
      event.preventDefault();

      // dblclick
      this.addEventListener('mousedown', this.#toggleMaximize);
      setTimeout(() => this.removeEventListener('mousedown', this.#toggleMaximize), 300);
    });

    this.#onResize();
    this.#window?.listen('tauri://resize', this.#onResize);

    this.#window?.listen('tauri://blur', () => this.setState({ blur: true }));
    this.#window?.listen('tauri://focus', () => this.setState({ blur: false }));

    this.#window?.listen('tauri://close-requested', async () => {
      dispatchEvent(new CustomEvent('pagehide'));
      dispatchEvent(new CustomEvent('beforeunload'));
      dispatchEvent(new CustomEvent('unload'));
      await Promise.all([...closeListenerSet].map((fn) => fn()));
      this.#window?.close();
    });
    // allow drag
    new MutationObserver(() => (this.inert = false)).observe(this, { attributeFilter: ['inert'] });
  }

  render = () => {
    if (this.state.fullscreen) return html``;

    return html`
      <dy-reflect>
        <style>
          :root {
            /* similar env */
            --titlebar-area-height: ${this.#isWin ? '32px' : '38px'};
          }
        </style>
      </dy-reflect>
      <div class="title">${document.title}</div>
      ${this.#isWin
        ? // https://codepen.io/agrimsrud/pen/WGgRPP?editors=1100
          html`
            <div
              class=${classMap({ buttons: true, blur: this.state.blur })}
              @mousedown=${(e: Event) => e.stopPropagation()}
            >
              <dy-use class="min" @click=${() => this.#window?.minimize()} .element=${minimize}></dy-use>
              <dy-use
                class="toggle"
                @click=${() => this.#window?.toggleMaximize()}
                .element=${this.state.maximized ? unmaximize : maximize}
              ></dy-use>
              <dy-use class="close" @click=${() => this.#window?.close()} .element=${close}></dy-use>
            </div>
          `
        : ''}
    `;
  };
}
