import {
  adoptedStyle,
  classMap,
  createState,
  css,
  customElement,
  GemElement,
  html,
  property,
  unmounted,
} from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import type { MStageElement } from 'src/modules/stage';
import { theme } from 'src/theme';
import { saveFile } from 'src/utils/common';

import 'duoyun-ui/elements/use';
import 'src/elements/tooltip';

const style = css`
  .recording {
    color: ${theme.negativeColor};
  }
`;

type State = {
  recorder?: MediaRecorder;
  stopStream?: () => void;
};

@customElement('m-room-recorder')
@adoptedStyle(style)
export class MRoomRecorderElement extends GemElement {
  @property getStream: MStageElement['getStream'];

  #state = createState<State>({});

  #onClick = () => {
    if (this.#state.recorder) {
      this.#state.recorder.stop();
      this.#state.stopStream?.();
      this.#state({ recorder: undefined });
    } else {
      const { stream, stopStream } = this.getStream();
      const recorder = new MediaRecorder(stream);
      recorder.start();
      recorder.ondataavailable = ({ data }) => {
        saveFile(new File([data], `Record ${new Time().format()}.webm`));
      };
      this.#state({ recorder, stopStream });
    }
  };

  @unmounted()
  #clear = () => {
    if (this.#state.recorder) {
      this.#state.recorder.ondataavailable = null;
      this.#state.recorder.stop();
      this.#state.stopStream?.();
    }
  };

  render = () => {
    const { recorder } = this.#state;
    return html`
      <nesbox-tooltip
        .content=${recorder ? i18n.get('tooltip.game.stopRecord') : i18n.get('tooltip.game.startRecord')}
        position="topRight"
      >
        <dy-use
          class=${classMap({ recording: !!recorder })}
          .element=${icons.screenRecord}
          @click=${this.#onClick}
        ></dy-use>
      </nesbox-tooltip>
    `;
  };
}
