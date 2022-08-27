import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  numattribute,
} from '@mantou/gem';
import type { Columns } from 'duoyun-ui/elements/table';
import { Toast } from 'duoyun-ui/elements/toast';

import { Cheat, configure } from 'src/configure';
import { icons } from 'src/icons';
import { updateAccount } from 'src/services/api';
import { MNesElement } from 'src/modules/nes';

import 'duoyun-ui/elements/table';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/space';
import 'duoyun-ui/elements/switch';
import 'duoyun-ui/elements/shortcut-record';
import 'duoyun-ui/elements/button';

const style = createCSSSheet(css`
  :host {
    display: block;
  }
  .list {
    width: 40em;
    min-height: 20em;
    margin-block-end: 1em;
  }
  .list::part(side) {
    height: 10em;
  }
`);

type State = {
  newCheat?: Cheat;
};

/**
 * @customElement m-cheat-settings
 */
@customElement('m-cheat-settings')
@adoptedStyle(style)
@connectStore(configure)
export class MCheatSettingsElement extends GemElement<State> {
  @numattribute gameId: number;

  state: State = {};

  get #data() {
    return configure.user?.settings.cheat[this.gameId] || [];
  }

  get #cheatSettings() {
    return configure.user?.settings.cheat[this.gameId] || [];
  }

  #onChangeNewCheat = (detail: Partial<Cheat>) => {
    this.setState({ newCheat: Object.assign(this.state.newCheat, detail) });
  };

  #onChangeSettings = (data: Cheat[]) => {
    return updateAccount({
      settings: {
        ...configure.user!.settings,
        cheat: {
          ...configure.user?.settings.cheat,
          [this.gameId]: data,
        },
      },
    });
  };

  #addNewCheat = () => {
    this.setState({ newCheat: { code: '', comment: '', enabled: true, toggleKey: '' } });
  };

  #addData = async (data: Cheat) => {
    if (this.#cheatSettings.find((e) => e.code === data.code)) {
      Toast.open('error', 'Code 重复');
    } else if (MNesElement.parseCheatCode(data)) {
      await this.#onChangeSettings([...this.#cheatSettings, data]);
      this.setState({ newCheat: undefined });
    } else {
      Toast.open('error', 'Code 格式错误');
    }
  };

  #removeData = (data: Cheat) => {
    if (data === this.state.newCheat) {
      this.setState({ newCheat: undefined });
    } else {
      this.#onChangeSettings(this.#cheatSettings.filter((e) => e !== data));
    }
  };

  #changeToggleKey = (data: Cheat, detail: string[]) => {
    if (detail.length > 1 || detail[0].length > 1) return;
    if (data === this.state.newCheat) {
      this.#onChangeNewCheat({ toggleKey: detail[0] });
    } else {
      this.#onChangeSettings(
        this.#cheatSettings.map((e) => (e === data ? Object.assign(data, { toggleKey: detail[0] }) : e)),
      );
    }
  };

  #toggle = (data: Cheat) => {
    if (data === this.state.newCheat) {
      this.#onChangeNewCheat({ enabled: !data.enabled });
    } else {
      this.#onChangeSettings(
        this.#cheatSettings.map((e) => (e === data ? Object.assign(data, { enabled: !data.enabled }) : e)),
      );
    }
  };

  render = () => {
    const data = this.#data;
    const columns: Columns<Cheat> = [
      {
        title: 'Code',
        dataIndex: 'code',
        render: (data) =>
          data === this.state.newCheat
            ? html`
                <dy-input
                  style="width: 100%"
                  @change=${({ detail }: CustomEvent<string>) => this.#onChangeNewCheat({ code: detail.toUpperCase() })}
                  .value=${data.code}
                ></dy-input>
              `
            : data.code,
      },
      {
        title: 'Comment',
        dataIndex: 'comment',
        render: (data) =>
          data === this.state.newCheat
            ? html`
                <dy-input
                  style="width: 100%"
                  @change=${({ detail }: CustomEvent<string>) => this.#onChangeNewCheat({ comment: detail })}
                  .value=${data.comment}
                ></dy-input>
              `
            : data.comment,
      },
      {
        title: 'Toggle Key',
        dataIndex: 'toggleKey',
        width: '25%',
        render: (data) =>
          html`
            <dy-shortcut-record
              style="width: 100%"
              @change=${({ detail }: CustomEvent<string[]>) => this.#changeToggleKey(data, detail)}
              .value=${data.toggleKey ? [data.toggleKey] : undefined}
            ></dy-shortcut-record>
          `,
      },
      {
        title: 'Enabled',
        dataIndex: 'enabled',
        render: (data) =>
          html`
            <dy-switch @change=${() => this.#toggle(data)} neutral="informative" .checked=${data.enabled}></dy-switch>
          `,
        style: {
          textAlign: 'center',
        },
      },
      {
        title: '',
        render: (data) =>
          html`
            <dy-space>
              <dy-button
                ?hidden=${data !== this.state.newCheat}
                @click=${() => this.#addData(data)}
                small
                .icon=${icons.check}
              ></dy-button>
              <dy-button color="danger" @click=${() => this.#removeData(data)} small .icon=${icons.close}></dy-button>
            </dy-space>
          `,
      },
    ];

    return html`
      <dy-table
        class="list"
        .data=${this.state.newCheat ? [...data, this.state.newCheat] : data}
        .columns=${columns}
        .noData=${' '}
      ></dy-table>
      <dy-button ?disabled=${!!this.state.newCheat} @click=${this.#addNewCheat}>添加新项</dy-button>
    `;
  };
}
