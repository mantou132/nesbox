import { createCSSSheet, customElement, css, adoptedStyle } from '@mantou/gem';
import { DuoyunScrollBaseElement } from 'duoyun-ui/elements/base/scroll';
import { events } from 'src/constants';

import { GamepadBtnIndex } from 'src/gamepad';

const style = createCSSSheet(css`
  :host {
    scroll-behavior: smooth;
  }
`);

/**
 * @customElement nesbox-scroll
 */
@customElement('nesbox-scroll')
@adoptedStyle(style)
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
  mounted = () => {
    addEventListener(events.PRESS_BUTTON_INDEX, this.#pressButton);
    return () => {
      removeEventListener(events.PRESS_BUTTON_INDEX, this.#pressButton);
    };
  };
}
