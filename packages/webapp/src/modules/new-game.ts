import { adoptedStyle, createState, css, customElement, GemElement, html, mounted } from '@mantou/gem';
import { Modal } from 'duoyun-ui/elements/modal';
import { locale } from 'duoyun-ui/lib/locale';
import { githubRelease } from 'src/constants';
import { gameKindList, gamePlatformList } from 'src/enums';
import { i18n } from 'src/i18n/basic';
import { type GameAttributes, store } from 'src/store';
import { theme } from 'src/theme';
import { getCDNSrc } from 'src/utils/common';

import 'duoyun-ui/elements/alert';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/picker';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/paragraph';

import { closestElement } from 'duoyun-ui/lib/element';

const style = css`
  :scope {
    display: flex;
    flex-direction: column;
    width: min(27em, 100vw);
    gap: 1em;
  }
  .tip {
    text-align: justify;
    border: 1px solid ${theme.borderColor};
  }
  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 1em;
    margin-top: 1.5em;
  }
`;

type State = {
  // 别名会以 `/xxx` 添加为后缀
  // 重名时游戏名称添加了`（中文/日本語）`后缀
  title: string;
  description: string;
  kind?: string;
  series?: string;
  maxPlayer?: string;
  platform?: string;
  metadata?: { title: string; description: string }[];
  step: number;
  attrs: GameAttributes;
};

@customElement('m-new-game')
@adoptedStyle(style)
export class MNewGameElement extends GemElement {
  state = createState<State>({
    title: '',
    description: '',
    step: 1,
    attrs: {},
  });

  #updateDesc = () => {
    const { title, metadata } = this.state;
    this.state({ description: metadata?.find((e) => e.title === title)?.description || '' });
  };

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.state({ title: detail });
    this.#updateDesc();
  };

  #fetchMetadata = async () => {
    const existedNameSet = new Set<string>();
    Object.values(store.games).forEach((game) => {
      if (game) {
        [game.name, game.name.replace(/（.*）$/, ''), ...game.name.split('/')].forEach((name) =>
          existedNameSet.add(name),
        );
      }
    });
    const excludeGames = new Set(['马力欧兄弟/水管马力欧', '忍者神龟 街机版', 'Mighty 快打旋风', 'Super C']);

    this.state({
      metadata: (
        (await (await fetch(getCDNSrc(`${githubRelease}/download/0.0.1/metadata.json`))).json()) as Exclude<
          State['metadata'],
          undefined
        >
      ).filter((e) => !existedNameSet.has(e.title) && !excludeGames.has(e.title)),
    });
    this.#updateDesc();
  };

  #getContent = () => {
    const { kind, maxPlayer, platform, title, metadata, step, attrs } = this.state;
    const { ad_link = '', ad_text = '' } = attrs;
    switch (step) {
      case 1:
        return html`
          <dy-paragraph>
            <dy-alert class="tip" .header=${i18n.get('tip.game.adsTitle')} .status=${'default'}>
              ${i18n.get('tip.game.ads')}
            </dy-alert>
          </dy-paragraph>
          <dy-input-group>
            <dy-input
              .placeholder=${i18n.get('placeholder.adText')}
              .value=${ad_text}
              @change=${({ detail }: CustomEvent<string>) => this.state({ attrs: { ...attrs, ad_text: detail } })}
            ></dy-input>
          </dy-input-group>
          <dy-input-group>
            <dy-input
              .placeholder=${i18n.get('placeholder.adLink')}
              .value=${ad_link}
              @change=${({ detail }: CustomEvent<string>) => this.state({ attrs: { ...attrs, ad_link: detail } })}
            ></dy-input>
          </dy-input-group>
        `;
      default:
        return html`
          <dy-paragraph>
            <dy-alert class="tip" .header=${'Tip'} .status=${'default'}>${i18n.get('tip.game.add')}</dy-alert>
          </dy-paragraph>
          <dy-input-group>
            <dy-input
              .autofocus=${true}
              .placeholder=${i18n.get('page.game.name')}
              .value=${title}
              .dataList=${metadata?.map((e) => ({ label: e.title }))}
              @change=${this.#onChange}
            ></dy-input>
          </dy-input-group>
          <dy-input-group>
            <dy-picker
              .value=${platform ?? undefined}
              .placeholder=${i18n.get('page.game.platform')}
              .options=${gamePlatformList.map((e) => ({
                value: e.value && `game.platform.${e.value.toLowerCase()}`,
                label: i18n.get(e.label),
              }))}
              @change=${({ detail }: CustomEvent<string>) => this.state({ platform: detail })}
            ></dy-picker>
            <dy-picker
              .value=${maxPlayer ?? undefined}
              .placeholder=${i18n.get('page.game.maxPlayer')}
              .options=${['', '1', '2', '4'].map((value) => ({
                value: value && `game.max_player.${value}`,
                label: value ? i18n.get('page.game.player', value) : i18n.get('global.noLimit'),
              }))}
              @change=${({ detail }: CustomEvent<string>) => this.state({ maxPlayer: detail })}
            ></dy-picker>
            <dy-picker
              .value=${kind ?? undefined}
              .placeholder=${i18n.get('page.game.kind')}
              .options=${gameKindList.map((e) => ({
                value: e.value && `game.kind.${e.value.toLowerCase()}`,
                label: i18n.get(e.label),
              }))}
              @change=${({ detail }: CustomEvent<string>) => this.state({ kind: detail })}
            ></dy-picker>
          </dy-input-group>
        `;
    }
  };

  #next = () => {
    if (this.state.step === 1) {
      this.state({ step: ++this.state.step });
    } else {
      closestElement(this, Modal)?.ok(null);
    }
  };

  @mounted()
  #init = () => {
    this.#fetchMetadata();
  };

  render = () => {
    return html`
      ${this.#getContent()}
      <div class="footer">
        <dy-button color="cancel" @click=${() => closestElement(this, Modal)?.close(null)}>${locale.cancel}</dy-button>
        <dy-button color="normal" @click=${this.#next}>${locale.nextTour}</dy-button>
      </div>
    `;
  };
}
