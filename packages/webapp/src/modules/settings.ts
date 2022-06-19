import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { theme } from 'src/theme';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/tabs';
import 'src/modules/keybinding';
import 'src/modules/account-settings';

type State = {
  tab: number;
};

const style = createCSSSheet(css`
  :host {
    display: flex;
    width: min(50vw, 50em);
    height: 50vh;
  }
  .tabs {
    width: 100%;
  }
  .tabs::part(tabs) {
    width: 8em;
  }
  .tabs::part(tab) {
    padding: 0.5em;
  }
  .tabs::part(current-tab) {
    background-color: ${theme.hoverBackgroundColor};
    border-radius: ${`${theme.smallRound} 0 0 ${theme.smallRound}`};
  }
  .tabs::part(marker) {
    display: none;
  }
`);

/**
 * @customElement m-settings
 */
@customElement('m-settings')
@adoptedStyle(style)
@connectStore(i18n.store)
export class MSettingsElement extends GemElement<State> {
  state: State = {
    tab: 0,
  };

  #onChange = ({ detail }: CustomEvent<number>) => {
    this.setState({ tab: detail });
  };

  render = () => {
    return html`
      <dy-tabs
        class="tabs"
        orientation="vertical"
        @change=${this.#onChange}
        .value=${this.state.tab}
        .data=${[
          {
            tab: i18n.get('accountSetting'),
            getContent() {
              return html`
                <dy-tab-panel style="scrollbar-width: none">
                  <m-account-settings></m-account-settings>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('keySetting'),
            getContent() {
              return html`
                <dy-tab-panel style="scrollbar-width: none">
                  <m-keybinding></m-keybinding>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('license'),
            getContent() {
              return html`
                <dy-tab-panel style="scrollbar-width: none">
                  MIT License Copyright (c) 2021-present Permission is hereby granted, free of charge, to any person
                  obtaining a copy of this software and associated documentation files (the "Software"), to deal in the
                  Software without restriction, including without limitation the rights to use, copy, modify, merge,
                  publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
                  Software is furnished to do so, subject to the following conditions: The above copyright notice and
                  this permission notice shall be included in all copies or substantial portions of the Software. THE
                  SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                  LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
                  NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
                  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
                  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                </dy-tab-panel>
              `;
            },
          },
        ]}
      ></dy-tabs>
    `;
  };
}
