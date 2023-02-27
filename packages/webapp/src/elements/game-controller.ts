import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, refobject, RefObject } from '@mantou/gem';
import { Button } from '@mantou/nes';
import { events } from 'src/constants';

import gamepadImg from 'src/images/gamepad.svg?raw';

import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  ::part(base),
  ::part(left-base),
  ::part(right-base),
  ::part(top-area),
  ::part(left-area),
  ::part(right-area),
  ::part(center-area),
  .center::part(reset) {
    display: none;
  }
  .left::part(left-area),
  .right::part(right-area),
  .center::part(center-area) {
    display: block;
  }
  .left,
  .right,
  .center {
    position: absolute;
    aspect-ratio: 1;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  ::part(active) {
    opacity: 0.5;
  }
  .left {
    left: 0;
    bottom: 0;
    height: 80%;
    transform: translateX(-2em);
  }
  .center {
    right: 0;
    top: 0;
    height: 80%;
    transform: scale(0.75) translateX(3em) translateY(-50%);
    opacity: 0.2;
  }
  .right {
    right: 0;
    bottom: 0;
    height: 80%;
    transform: scale(0.75) translateX(3em);
  }
`);

/**
 * @customElement nesbox-game-controller
 */
@customElement('nesbox-game-controller')
@adoptedStyle(style)
export class NesboxGameControllerElement extends GemElement {
  @refobject leftRef: RefObject<HTMLDivElement>;
  @refobject centerRef: RefObject<HTMLDivElement>;
  @refobject rightRef: RefObject<HTMLDivElement>;

  #toBtn = (part?: string) => {
    switch (part) {
      case 'left':
        return Button.Joypad1Left;
      case 'right':
        return Button.Joypad1Right;
      case 'down':
        return Button.Joypad1Down;
      case 'up':
        return Button.Joypad1Up;
      case 'a':
        return Button.Joypad1A;
      case 'b':
        return Button.Joypad1B;
      case 'turbo-a':
        return Button.Joypad1TurboA;
      case 'turbo-b':
        return Button.Joypad1TurboB;
      case 'reset':
        return Button.Reset;
      case 'select':
        return Button.Select;
      case 'start':
        return Button.Start;
    }
  };

  mounted = () => {
    [
      [this.leftRef, 'leftAreaViewbox'] as const,
      [this.centerRef, 'centerAreaViewbox'] as const,
      [this.rightRef, 'rightAreaViewbox'] as const,
    ].map(([ref, attr]) => {
      const svg = ref.element?.shadowRoot?.querySelector('svg');
      svg?.setAttribute('viewBox', svg.dataset[attr]!);
    });

    this.addEventListener('touchstart', (evt: TouchEvent) => {
      const element = evt.composedPath()[0] as Element | undefined;
      const button = this.#toBtn(element?.part[0]);
      if (!button) return;
      navigator.vibrate?.(10);
      window.dispatchEvent(new CustomEvent(events.PRESS_BUTTON, { detail: button }));
      element?.part.add('active');
      const cancel = () => {
        element?.part.remove('active');
        window.dispatchEvent(new CustomEvent(events.RELEASE_BUTTON, { detail: button }));
        this.removeEventListener('touchend', cancel);
        this.removeEventListener('touchcancel', cancel);
      };
      this.addEventListener('touchend', cancel, { once: true });
      this.addEventListener('touchcancel', cancel, { once: true });
    });
  };

  render = () => {
    return html`
      <dy-use ref=${this.leftRef.ref} class="left" .element=${gamepadImg}></dy-use>
      <dy-use ref=${this.centerRef.ref} class="center" .element=${gamepadImg}></dy-use>
      <dy-use ref=${this.rightRef.ref} class="right" .element=${gamepadImg}></dy-use>
    `;
  };
}
