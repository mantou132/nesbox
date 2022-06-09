import { customElement, adoptedStyle, createCSSSheet, css } from '@mantou/gem';
import { DuoyunWaitElement } from 'duoyun-ui/elements/wait';

import { theme } from 'src/theme';

const style = createCSSSheet(css`
  :host {
    padding-top: calc(1em + ${theme.titleBarHeight});
  }
`);

/**
 * @customElement nesbox-wait
 */
@customElement('nesbox-wait')
@adoptedStyle(style)
export class NesboxWaitElement extends DuoyunWaitElement {}
