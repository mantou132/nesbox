import { addListener, adoptedStyle, css, customElement, mounted, shadow } from '@mantou/gem';
import { DuoyunScrollBaseElement } from 'duoyun-ui/elements/base/scroll';
import { globalEvents } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';

const style = css`
  :host {
    scroll-behavior: smooth;
  }
`;

@customElement('nesbox-scroll')
@adoptedStyle(style)
@shadow()
export class NesboxScrollElement extends DuoyunScrollBaseElement {
  #pressButton = (evt: CustomEvent<GamepadBtnIndex>) => {
    switch (evt.detail) {
      case GamepadBtnIndex.Up:
        this.scrollBy(0, -100);
        break;
      case GamepadBtnIndex.Down:
        this.scrollBy(0, 100);
        break;
    }
  };

  @mounted()
  #init = () => addListener(window, globalEvents.PRESS_HOST_BUTTON_INDEX, this.#pressButton);
}
