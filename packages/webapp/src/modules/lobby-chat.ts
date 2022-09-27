import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  RefObject,
  refobject,
} from '@mantou/gem';
import { polling } from 'duoyun-ui/lib/utils';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import type { DuoyunInputElement } from 'duoyun-ui/elements/input';

import { i18n } from 'src/i18n';
import { enterLobby, leaveLobby, sendLobbyMsg } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/input';
import 'src/modules/lobby-msg';
import 'src/elements/scroll';

const style = createCSSSheet(css`
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
`);

type State = {
  input: string;
  start: boolean;
};

/**
 * @customElement m-lobby-chat
 */
@customElement('m-lobby-chat')
@adoptedStyle(style)
@connectStore(store)
@connectStore(i18n.store)
export class MLobbyChatElement extends GemElement<State> {
  @refobject messageRef: RefObject<HTMLElement>;
  @refobject inputRef: RefObject<DuoyunInputElement>;

  state: State = {
    input: '',
    start: false,
  };

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.setState({ input: detail });
  };

  #onKeydown = hotkeys({
    enter: async () => {
      await sendLobbyMsg(this.state.input);
      this.setState({ input: '' });
      this.inputRef.element?.blur();
    },
  });

  mounted = () => {
    this.effect(
      () => polling(enterLobby, 13_000),
      () => [i18n.currentLanguage],
    );

    this.effect(
      () => {
        this.messageRef.element?.scrollTo(0, 10000);
      },
      () => [store.lobbyMessage],
    );

    return () => {
      leaveLobby();
    };
  };

  render = () => {
    const { lobbyMessage, lobbyInfo } = store;
    return html`
      <nesbox-scroll ref=${this.messageRef.ref} class="list">
        ${lobbyMessage.map((msg) => html`<m-lobby-msg .msg=${msg}></m-lobby-msg>`)}
      </nesbox-scroll>
      ${this.state.start
        ? html`
            <dy-input
              ref=${this.inputRef.ref}
              autofocus
              class="input"
              .value=${this.state.input}
              .placeholder=${i18n.get('placeholderMessage')}
              @blur=${() => this.setState({ start: false })}
              @change=${this.#onChange}
              @keydown=${this.#onKeydown}
            ></dy-input>
          `
        : html`
            <dy-button
              title=${`Online ${lobbyInfo?.onlineUserCount}`}
              color="cancel"
              .icon=${icons.chat}
              @click=${() => this.setState({ start: true })}
            >
              ${i18n.get('lobbyUserCount', String(lobbyInfo?.lobbyUserCount || 1))}
            </dy-button>
          `}
    `;
  };
}
