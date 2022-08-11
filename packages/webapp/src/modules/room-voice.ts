import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  createStore,
  connectStore,
  updateStore,
} from '@mantou/gem';

import { configure } from 'src/configure';
import { icons } from 'src/icons';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  .icon {
    width: 1.3em;
    padding: 0.2em;
    border-radius: ${theme.smallRound};
  }
  .icon:hover {
    background: ${theme.lightBackgroundColor};
  }
`);

const store = createStore({
  joined: false,
});

/**
 * @customElement m-room-voice
 */
@customElement('m-room-voice')
@adoptedStyle(style)
@connectStore(store)
@connectStore(configure)
export class MVoiceRoomElement extends GemElement {
  #toggleVoice = () => {
    updateStore(store, { joined: !store.joined });
  };

  mounted = () => {
    this.effect(
      ([roomId]) => {
        if (roomId && store.joined) {
          // webrtc connect server
          return () => {
            // close
          };
        }
      },
      () => [configure.user?.playing?.id, store.joined],
    );
  };

  render = () => {
    return html`
      <dy-use class="icon" @click=${this.#toggleVoice} .element=${store.joined ? icons.mic : icons.micOff}></dy-use>
    `;
  };
}
