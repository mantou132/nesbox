import { adoptedStyle, attribute, createState, css, customElement, effect, GemElement, html } from '@mantou/gem';
import { marked } from 'marked';
import { eventStream } from 'src/services';

import 'duoyun-ui/elements/unsafe';

import { i18n } from 'src/i18n/basic';

const style = css`
  :scope {
    display: block;
    white-space: normal;
  }
`;

const contentStyle = css`
  :host > :first-child {
    margin-top: 0;
  }
  :host > :last-child {
    margin-bottom: 0;
  }
`;

@customElement('m-sse')
@adoptedStyle(style)
export class MSeeElement extends GemElement {
  @attribute prompt: string;

  #state = createState({ md: '' });

  #control = new AbortController();

  @effect((i) => [i.prompt])
  #req = () => {
    const initMd = 'Thinking...';
    this.#state({ md: initMd });
    const timer = setTimeout(async () => {
      const url = `https://nesbox.709922234.workers.dev/completions?${new URLSearchParams({ q: this.prompt, l: i18n.currentLanguage })}`;
      const iter = eventStream(url, { signal: this.#control.signal });
      for await (const chunk of iter) {
        const append = chunk.choices?.at(0)?.delta?.content;
        if (!append) continue;
        this.#state({ md: (this.#state.md === initMd ? '' : this.#state.md) + append });
      }
    }, 2000);
    return () => {
      clearTimeout(timer);
      this.#control.abort();
      this.#control = new AbortController();
    };
  };

  render = () => {
    return html`<dy-unsafe html=${marked.parse(this.#state.md)} .styles=${contentStyle}></dy-unsafe>`;
  };
}
