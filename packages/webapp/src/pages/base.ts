import { GemElement, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';

import { theme } from 'src/theme';

const style = createCSSSheet(css`
  main {
    display: flex;
    flex-direction: column;
    gap: 1.5em;
    width: min(100%, ${theme.mainWidth});
    margin: auto;
    min-height: 100vh;
    box-sizing: border-box;
  }
`);

/**
 * @customElement p-base
 */
@customElement('p-base')
@adoptedStyle(style)
export class PBaseElement<T = Record<string, string>> extends GemElement<T> {}
