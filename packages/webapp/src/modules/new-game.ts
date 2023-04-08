import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { getCDNSrc } from 'src/utils/common';
import { githubRelease } from 'src/constants';
import { i18n } from 'src/i18n/basic';
import { theme } from 'src/theme';
import { gameKindList, gameSeriesList } from 'src/enums';
import { store } from 'src/store';

import 'duoyun-ui/elements/alert';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/pick';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/paragraph';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    width: min(27em, 100vw);
    gap: 1em;
  }
  .tip {
    text-align: justify;
    border: 1px solid ${theme.borderColor};
  }
`);

type State = {
  // 别名会以 `/xxx` 添加为后缀
  // 重名时游戏名称添加了`（中文/日本語）`后缀
  title: string;
  description: string;
  kind: string;
  series: string;
  maxPlayer: string;
  platform: string;
  metadata?: { title: string; description: string }[];
};

/**
 * @customElement m-new-game
 */
@customElement('m-new-game')
@adoptedStyle(style)
@connectStore(i18n.store)
export class MNewGameElement extends GemElement<State> {
  state: State = {
    title: '',
    description: '',
    kind: '',
    series: '',
    maxPlayer: '',
    platform: 'game.platform.nes',
  };

  #updateDesc = () => {
    const { title, metadata } = this.state;
    this.setState({ description: metadata?.find((e) => e.title === title)?.description || '' });
  };

  #onChange = ({ detail }: CustomEvent<string>) => {
    this.setState({ title: detail });
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

    this.setState({
      metadata: (
        (await (await fetch(getCDNSrc(`${githubRelease}/download/0.0.1/metadata.json`))).json()) as Exclude<
          State['metadata'],
          undefined
        >
      ).filter((e) => !existedNameSet.has(e.title) && !excludeGames.has(e.title)),
    });
    this.#updateDesc();
  };

  mounted = () => {
    this.#fetchMetadata();
  };

  render = () => {
    const { kind, maxPlayer, series, title, metadata } = this.state;
    const tip = i18n.get(
      'addGameDetail',
      (e) => html`<dy-link @click=${() => open(`${githubRelease}/tag/0.0.1`)}>${e}</dy-link>`,
    );

    return html`
      <dy-paragraph>
        <dy-alert class="tip" .header=${'Tip'} .status=${'default'}>${tip}</dy-alert>
      </dy-paragraph>
      <dy-input-group>
        <dy-pick
          .value=${maxPlayer || undefined}
          .placeholder=${i18n.get('gameMaxPlayer')}
          .options=${['', '1', '2', '4'].map((value) => ({
            value: value && `game.max_player.${value}`,
            label: value ? i18n.get('gamePlayer', value) : i18n.get('gameNoLimit'),
          }))}
          @change=${({ detail }: CustomEvent<string>) => this.setState({ maxPlayer: detail })}
        ></dy-pick>
        <dy-pick
          .value=${kind || undefined}
          .placeholder=${i18n.get('gameKind')}
          .options=${gameKindList.map((e) => ({
            value: e.value && `game.kind.${e.value.toLowerCase()}`,
            label: i18n.get(e.label),
          }))}
          @change=${({ detail }: CustomEvent<string>) => this.setState({ kind: detail })}
        ></dy-pick>
        <dy-pick
          .value=${series || undefined}
          .placeholder=${i18n.get('gameSeries')}
          .options=${gameSeriesList.map((e) => ({
            value: e.value && `game.series.${e.value.toLowerCase()}`,
            label: i18n.get(e.label),
          }))}
          @change=${({ detail }: CustomEvent<string>) => this.setState({ series: detail })}
        ></dy-pick>
      </dy-input-group>
      <dy-input-group>
        <dy-input
          .autofocus=${true}
          .placeholder=${i18n.get('gameName')}
          .value=${title}
          .dataList=${metadata?.map((e) => ({ label: e.title }))}
          @change=${this.#onChange}
        ></dy-input>
      </dy-input-group>
    `;
  };
}
