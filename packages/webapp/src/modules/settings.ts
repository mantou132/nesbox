import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { theme } from 'src/theme';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/tabs';
import 'src/elements/license';
import 'src/modules/keybinding';
import 'src/modules/sound-settings';
import 'src/modules/account-settings';
import 'src/modules/video-settings';
import 'src/modules/shortcut-settings';

const style = createCSSSheet(css`
  :host {
    display: flex;
    width: min(50vw, 50em);
    height: 50vh;
    -webkit-user-select: none;
    user-select: none;
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
  .tabs::part(tab):hover {
    color: currentColor;
  }
  .tabs::part(current-tab) {
    color: currentColor;
    background-color: ${theme.hoverBackgroundColor};
    border-radius: ${`${theme.normalRound} 0 0 ${theme.normalRound}`};
  }
  .tabs::part(marker) {
    display: none;
  }
`);

type State = {
  tab: number;
};

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
            tab: i18n.get('keySetting'),
            getContent() {
              return html`
                <dy-tab-panel>
                  <m-keybinding></m-keybinding>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('shortcut'),
            getContent() {
              return html`
                <dy-tab-panel>
                  <m-shortcut-settings></m-shortcut-settings>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('soundSetting'),
            getContent() {
              return html`
                <dy-tab-panel>
                  <m-sound-settings></m-sound-settings>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('videoSetting'),
            getContent() {
              return html`
                <dy-tab-panel>
                  <m-video-settings></m-video-settings>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('accountSetting'),
            getContent() {
              return html`
                <dy-tab-panel>
                  <m-account-settings></m-account-settings>
                </dy-tab-panel>
              `;
            },
          },
          {
            tab: i18n.get('license'),
            getContent() {
              return html`
                <dy-tab-panel>
                  <nesbox-license></nesbox-license>
                </dy-tab-panel>
              `;
            },
          },
        ]}
      ></dy-tabs>
    `;
  };
}
