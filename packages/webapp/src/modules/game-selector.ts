import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  Emitter,
  globalemitter,
} from '@mantou/gem';

import { store } from 'src/store';
import { updateRoom } from 'src/services/api';
import { configure } from 'src/configure';

import 'src/modules/game-item';

const style = createCSSSheet(css`
  :host {
    width: min(60vw, 50em);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8em, 1fr));
    grid-template-rows: max-content;
    grid-gap: 1em;
  }
  .item {
    aspect-ratio: 3 / 4;
  }
`);

/**
 * @customElement m-game-selector
 */
@customElement('m-game-selector')
@adoptedStyle(style)
@connectStore(store)
export class MGameSelectorElement extends GemElement {
  @globalemitter close: Emitter<null>;

  #onSelect = async (gameId: number) => {
    const { host, id, private: p } = configure.user!.playing!;
    await updateRoom({ gameId, host, id, private: p });
    this.close(null);
  };

  render = () => {
    return html`
      ${store.gameIds?.map(
        (id) =>
          store.games[id] &&
          html`
            <m-game-item .silent=${true} .game=${store.games[id]!} @click=${() => this.#onSelect(id)}></m-game-item>
          `,
      )}
    `;
  };
}
