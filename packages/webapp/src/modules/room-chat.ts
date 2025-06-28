import {
  addListener,
  adoptedStyle,
  classMap,
  createRef,
  createState,
  css,
  customElement,
  type Emitter,
  effect,
  emitter,
  GemElement,
  html,
  mounted,
  property,
  repeat,
  shadow,
} from '@mantou/gem';
import type { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { Time } from 'duoyun-ui/lib/time';
import { sleep } from 'duoyun-ui/lib/timer';
import { configure, getShortcut } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { type SysMsg, TextMsg } from 'src/netplay/common';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/input';

const style = css`
  :host {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  .message {
    display: flex;
    flex-direction: column-reverse;
    flex-grow: 1;
    min-height: 0;
    overflow: auto;
    font-size: 0.875em;
    /* 点击事件需要传递给 stage, 所以这里不应该接受 pointer 事件 */
    user-select: none;
    scrollbar-width: none;
  }
  .message::-webkit-scrollbar {
    width: 0;
  }
  .message.silent {
    opacity: 0.5;
  }
  .msg {
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
  }
  .msg.system {
    color: ${theme.informativeColor};
  }
  .input {
    flex-shrink: 0;
    border-radius: ${theme.smallRound};
  }
`;

@customElement('m-room-chat')
@adoptedStyle(style)
@shadow()
export class MRoomChatElement extends GemElement {
  @property messages: TextMsg[];
  @emitter submit: Emitter<TextMsg>;

  #inputRef = createRef<DuoyunInputElement>();
  #messageRef = createRef<HTMLElement>();

  #state = createState({
    input: '',
    silent: true,
    speechTimer: 0,
  });

  #stopPropagation = (event: Event) => event.stopPropagation();

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.#state({ input: detail });
  };

  #onSubmit = (evt: KeyboardEvent) => {
    evt.preventDefault();
    this.#state.input && this.submit(new TextMsg(this.#state.input));
    this.#state({ input: '', silent: true });
  };

  #onEsc = () => {
    if (this.#state.input) {
      this.#state({ input: '' });
    } else {
      this.#inputRef.value?.blur();
      this.update();
    }
  };

  #onKeyDown = (evt: KeyboardEvent) => {
    this.#stopPropagation(evt);
    hotkeys({
      enter: this.#onSubmit,
      esc: this.#onEsc,
    })(evt);
  };

  #onGlobalKeyDown = (evt: KeyboardEvent) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!configure.user || !SpeechRecognition) return;
    hotkeys({
      [getShortcut('ROOM_SPEECH')]: async () => {
        const originInput = this.#state.input;
        const recognition = new SpeechRecognition();
        recognition.lang = document.documentElement.lang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const getTimer = () => {
          clearTimeout(this.#state.speechTimer);
          return window.setTimeout(() => {
            recognition.stop();
            if (this.#state.speechTimer) {
              this.#state({ speechTimer: 0, silent: true, input: originInput });
            }
          }, 3000);
        };
        this.#state({ silent: false, speechTimer: getTimer() });

        recognition.addEventListener('result', ({ results }) => {
          if (this.#state.speechTimer) {
            this.#state({ input: results[0].item(0).transcript, speechTimer: getTimer() });
          }
        });
        recognition.start();
      },
    })(evt);
  };

  focus = async () => {
    this.#state({ silent: false, speechTimer: 0 });
    await new Promise((res) => setTimeout(res));
    this.#inputRef.value?.focus();
  };

  @effect((i) => [i.messages])
  #scroll = () => this.#messageRef.value?.scrollTo(0, 10000);

  @effect((i) => [i.#state.silent])
  #resetFocus = () => this.#inputRef.value?.blur();

  #timer = 0;
  @effect()
  #resetTimeout = () => {
    clearTimeout(this.#timer);
    this.#timer = window.setTimeout(async () => {
      const activeElement = this.shadowRoot?.activeElement;
      if (activeElement) {
        await new Promise((res) => activeElement.addEventListener('blur', res, { once: true }));
        await sleep(3000);
      }
      this.#state({ silent: true });
    }, 3000);
  };

  @mounted()
  #init = () => {
    this.addEventListener('mouseover', () => this.#state({ silent: false }));
    return addListener(document, 'keydown', this.#onGlobalKeyDown);
  };

  render = () => {
    return html`
      <div ${this.#messageRef} class=${classMap({ message: true, silent: this.#state.silent })}>
        ${repeat(
          this.messages,
          ({ timestamp }) => timestamp,
          (msg) => html`
            <div class=${classMap({ msg: true, system: !msg.userId })}>
              <span>
                [${new Time(msg.timestamp).format('HH:mm:ss')}]
                ${msg.userId ? msg.nickname : i18n.get('page.room.systemName')}
              </span>
              :
              <span>${msg.userId ? msg.text : i18n.get(...(msg.text.split('\n') as SysMsg))}</span>
            </div>
          `,
        )}
      </div>
      <dy-input
        ${this.#inputRef}
        v-if=${!this.#state.silent}
        class=${classMap({ input: true })}
        .icon=${this.#state.speechTimer ? icons.loading : undefined}
        placeholder=${this.#state.speechTimer ? 'Speech Recognition' : i18n.get('placeholder.message')}
        @keydown=${this.#onKeyDown}
        @keyup=${this.#stopPropagation}
        @change=${this.#onChange}
        .value=${this.#state.input}
      ></dy-input>
    `;
  };
}
