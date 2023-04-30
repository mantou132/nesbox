import { GemElement, html, customElement, classMap, createCSSSheet, css, adoptedStyle, property } from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';

import { icons } from 'src/icons';
import { saveFile } from 'src/utils/common';
import { theme } from 'src/theme';

import type { MStageElement } from 'src/modules/stage';

import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  .recording {
    color: ${theme.negativeColor};
  }
`);

type State = {
  recorder?: MediaRecorder;
  stopStream?: () => void;
};

/**
 * @customElement m-room-recorder
 */
@customElement('m-room-recorder')
@adoptedStyle(style)
export class MRoomRecorderElement extends GemElement<State> {
  @property getStream: MStageElement['getStream'];

  state: State = {};

  #onClick = () => {
    if (this.state.recorder) {
      this.state.recorder.stop();
      this.state.stopStream?.();
      this.setState({ recorder: undefined });
    } else {
      const { stream, stopStream } = this.getStream();
      const recorder = new MediaRecorder(stream);
      recorder.start();
      recorder.ondataavailable = ({ data }) => {
        saveFile(new File([data], `Record ${new Time().format()}.webm`));
      };
      this.setState({ recorder, stopStream });
    }
  };

  unmounted = () => {
    if (this.state.recorder) {
      this.state.recorder.ondataavailable = null;
      this.state.recorder.stop();
      this.state.stopStream?.();
    }
  };

  render = () => {
    return html`
      <dy-use
        class=${classMap({ recording: !!this.state.recorder })}
        .element=${icons.screenRecord}
        @click=${this.#onClick}
      ></dy-use>
    `;
  };
}
