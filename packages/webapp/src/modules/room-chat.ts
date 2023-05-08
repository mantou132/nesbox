import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  emitter,
  Emitter,
  refobject,
  RefObject,
  connectStore,
  repeat,
  classMap,
} from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { sleep } from 'duoyun-ui/lib/utils';
import { Time } from 'duoyun-ui/lib/time';

import { SysMsg, TextMsg } from 'src/netplay/common';
import { i18n } from 'src/i18n/basic';
import { theme } from 'src/theme';
import { configure, getShortcut } from 'src/configure';
import { icons } from 'src/icons';

import type { DuoyunInputElement } from 'duoyun-ui/elements/input';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/button';

const style = createCSSSheet(css`
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
`);

type State = {
  input: string;
  silent: boolean;
  speechTimer: number;
};

/**
 * @customElement m-room-chat
 */
@customElement('m-room-chat')
@adoptedStyle(style)
@connectStore(i18n.store)
export class MRoomChatElement extends GemElement<State> {
  @property messages: TextMsg[];
  @emitter submit: Emitter<TextMsg>;
  @refobject inputRef: RefObject<DuoyunInputElement>;
  @refobject messageRef: RefObject<HTMLElement>;

  state: State = {
    input: '',
    silent: true,
    speechTimer: 0,
  };

  #stopPropagation = (event: Event) => event.stopPropagation();

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.setState({ input: detail });
  };

  #onSubmit = (evt: KeyboardEvent) => {
    evt.preventDefault();
    this.state.input && this.submit(new TextMsg(this.state.input));
    this.setState({ input: '', silent: true });
  };

  #onEsc = () => {
    if (this.state.input) {
      this.setState({ input: '' });
    } else {
      this.inputRef.element?.blur();
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
        const originInput = this.state.input;
        const recognition = new SpeechRecognition();
        recognition.lang = document.documentElement.lang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const getTimer = () => {
          clearTimeout(this.state.speechTimer);
          return window.setTimeout(() => {
            recognition.stop();
            if (this.state.speechTimer) {
              this.setState({ speechTimer: 0, silent: true, input: originInput });
            }
          }, 3000);
        };
        this.setState({ silent: false, speechTimer: getTimer() });

        recognition.addEventListener('result', ({ results }) => {
          if (this.state.speechTimer) {
            this.setState({ input: results[0].item(0).transcript, speechTimer: getTimer() });
          }
        });
        recognition.start();
      },
    })(evt);
  };

  focus = async () => {
    this.setState({ silent: false, speechTimer: 0 });
    await Promise.resolve();
    this.inputRef.element?.focus();
  };

  mounted = () => {
    this.addEventListener('mouseover', () => {
      this.setState({ silent: false });
    });

    this.effect(
      () => {
        this.messageRef.element?.scrollTo(0, 10000);
      },
      () => [this.messages],
    );

    this.effect(
      () => this.inputRef.element?.blur(),
      () => [this.state.silent],
    );

    let timer = 0;
    this.effect(() => {
      clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const activeElement = this.shadowRoot?.activeElement;
        if (activeElement) {
          await new Promise((res) => activeElement.addEventListener('blur', res, { once: true }));
          await sleep(3000);
        }
        this.setState({ silent: true });
      }, 3000);
    });

    addEventListener('keydown', this.#onGlobalKeyDown);
    return () => {
      removeEventListener('keydown', this.#onGlobalKeyDown);
    };
  };

  render = () => {
    return html`
      <div ref=${this.messageRef.ref} class=${classMap({ message: true, silent: this.state.silent })}>
        ${repeat(
          this.messages,
          ({ timestamp }) => timestamp,
          (msg) => html`
            <div class=${classMap({ msg: true, system: !msg.userId })}>
              <span>
                [${new Time(msg.timestamp).format('HH:mm:ss')}] ${msg.userId ? msg.nickname : i18n.get('system')}
              </span>
              :
              <span>${msg.userId ? msg.text : i18n.get(...(msg.text.split('\n') as SysMsg))}</span>
            </div>
          `,
        )}
      </div>
      ${this.state.silent
        ? ''
        : html`
            <dy-input
              ref=${this.inputRef.ref}
              class=${classMap({ input: true })}
              .icon=${this.state.speechTimer ? icons.loading : undefined}
              placeholder=${this.state.speechTimer ? 'Speech Recognition' : i18n.get('placeholder.message')}
              @keydown=${this.#onKeyDown}
              @keyup=${this.#stopPropagation}
              @change=${this.#onChange}
              .value=${this.state.input}
            ></dy-input>
          `}
    `;
  };
}
