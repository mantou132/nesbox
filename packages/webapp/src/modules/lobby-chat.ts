import {
  adoptedStyle,
  connectStore,
  createRef,
  createState,
  css,
  customElement,
  effect,
  GemElement,
  html,
  shadow,
  unmounted,
} from '@mantou/gem';
import type { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { polling } from 'duoyun-ui/lib/timer';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { enterLobby, leaveLobby, sendLobbyMsg } from 'src/services/api';
import { store } from 'src/store';

import 'duoyun-ui/elements/input';
import 'src/elements/scroll';
import 'src/modules/lobby-msg';

const style = css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 13em;
  }
  .list {
    width: 100%;
    max-height: 15em;
  }
  .list::-webkit-scrollbar {
    display: none;
  }
  .input {
    width: 100%;
  }
`;

@customElement('m-lobby-chat')
@adoptedStyle(style)
@connectStore(store)
@shadow()
export class MLobbyChatElement extends GemElement {
  #state = createState({
    input: '',
    start: false,
  });

  #messageRef = createRef<HTMLElement>();
  #inputRef = createRef<DuoyunInputElement>();

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.#state({ input: detail });
  };

  #onKeydown = hotkeys({
    enter: async () => {
      await sendLobbyMsg(this.#state.input);
      this.#state({ input: '' });
      this.#inputRef.value?.blur();
    },
  });

  @effect(() => [i18n.currentLanguage])
  #enter = () => polling(enterLobby, 13_000);

  @effect(() => [store.lobbyMessage])
  #scroll = () => this.#messageRef.value?.scrollTo(0, 10000);

  @unmounted()
  #clear = leaveLobby;

  render = () => {
    const { lobbyMessage, lobbyInfo } = store;
    return html`
      <nesbox-scroll ${this.#messageRef} class="list">
        ${lobbyMessage.map((msg) => html`<m-lobby-msg .msg=${msg}></m-lobby-msg>`)}
      </nesbox-scroll>
      ${
        this.#state.start
          ? html`
            <dy-input
              ${this.#inputRef}
              autofocus
              class="input"
              .value=${this.#state.input}
              .placeholder=${i18n.get('placeholder.message')}
              @blur=${() => this.#state({ start: false })}
              @change=${this.#onChange}
              @keydown=${this.#onKeydown}
            ></dy-input>
          `
          : html`
            <dy-button
              title=${`Online ${lobbyInfo?.onlineUserCount}`}
              color="cancel"
              .icon=${icons.chat}
              @click=${() => this.#state({ start: true })}
            >
              ${i18n.get('page.rooms.currentUser', String(lobbyInfo?.lobbyUserCount || 1))}
            </dy-button>
          `
      }
    `;
  };
}
