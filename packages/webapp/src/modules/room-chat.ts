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
import type { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { sleep } from 'duoyun-ui/lib/utils';
import { Time } from 'duoyun-ui/lib/time';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { TextMsg } from 'src/rtc';
import { i18n } from 'src/i18n';
import { theme } from 'src/theme';

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
  @media ${mediaQuery.PHONE} {
    :host {
      display: none;
    }
  }
`);

type State = {
  input: string;
  silent: boolean;
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
  };

  #stopPropagation = (event: Event) => event.stopPropagation();

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.setState({ input: detail });
  };

  #onSubmit = () => {
    this.state.input && this.submit(new TextMsg(this.state.input));
    this.setState({ input: '' });
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

  focus = async () => {
    this.setState({ silent: false });
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
  };

  render = () => {
    return html`
      <div class=${classMap({ message: true, silent: this.state.silent })} ref=${this.messageRef.ref}>
        ${repeat(
          this.messages,
          ({ timestamp }) => timestamp,
          (msg) => html`
            <div class=${classMap({ msg: true, system: !msg.userId })}>
              <span>[${new Time(msg.timestamp).format('HH:mm:ss')}] ${msg.username}</span>
              :
              <span>${msg.text}</span>
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
              placeholder=${i18n.get('placeholderMessage')}
              @keydown=${this.#onKeyDown}
              @keyup=${this.#stopPropagation}
              @change=${this.#onChange}
              .value=${this.state.input}
            ></dy-input>
          `}
    `;
  };
}
