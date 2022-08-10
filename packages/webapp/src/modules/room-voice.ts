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
import { createVoiceService } from 'src/services';
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
          const voice = createVoiceService(roomId);
          const writer = voice.writable.getWriter();
          const reader = voice.readable.getReader();
          reader.read().then(async function play({ done, value }) {
            if (!done && value) {
              // play blob
              await reader.read().then(play);
            }
          });
          const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          let record: MediaRecorder | null = null;
          streamPromise.then((stream) => {
            record = new MediaRecorder(stream, { audioBitsPerSecond: 64000 });
            record.start(1000);
            record.addEventListener('dataavailable', async ({ data }) => {
              await writer.ready;
              const buffer = await data.arrayBuffer();
              writer.write(buffer);
            });
          });
          return () => {
            voice.close();
            record?.stop();
            streamPromise.then((stream) => stream.getTracks().forEach((track) => track.stop()));
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
