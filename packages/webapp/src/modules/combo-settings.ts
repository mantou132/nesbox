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
import { Toast } from 'duoyun-ui/elements/toast';

import { Combo, configure } from 'src/configure';
import { icons } from 'src/icons';
import { updateAccount } from 'src/services/api';
import { i18n } from 'src/i18n/basic';
import { theme } from 'src/theme';

import type { Columns } from 'duoyun-ui/elements/table';

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
  .list::part(icon) {
    width: 1.5em;
    opacity: 0.8;
  }
  .list::part(close) {
    color: ${theme.negativeColor};
  }
  .list::part(icon):hover {
    opacity: 1;
  }
`);

type State = {
  newCombo?: Combo;
};

/**
 * @customElement m-combo-settings
 */
@customElement('m-combo-settings')
@adoptedStyle(style)
@connectStore(configure)
@connectStore(i18n.store)
export class MComboSettingsElement extends GemElement<State> {
  @numattribute gameId: number;

  state: State = {};

  get #data() {
    return configure.user?.settings.combo[this.gameId] || [];
  }

  get #comboSettings() {
    return configure.user?.settings.combo[this.gameId] || [];
  }

  #onChangeNewCombo = (detail: Partial<Combo>) => {
    this.setState({ newCombo: Object.assign(this.state.newCombo!, detail) });
  };

  #onChangeSettings = (data: Combo[]) => {
    return updateAccount({
      settings: {
        ...configure.user!.settings,
        combo: {
          ...configure.user?.settings.combo,
          [this.gameId]: data,
        },
      },
    });
  };

  #addNewCheat = () => {
    this.setState({ newCombo: { code: '', comment: '', enabled: true, binding: '' } });
  };

  #addData = async (data: Combo) => {
    if (this.#comboSettings.find((e) => e.code === data.code)) {
      Toast.open('error', i18n.get('tip.cheat.exist'));
    } else {
      await this.#onChangeSettings([...this.#comboSettings, data]);
      this.setState({ newCombo: undefined });
    }
  };

  #removeData = (data: Combo) => {
    if (data === this.state.newCombo) {
      this.setState({ newCombo: undefined });
    } else {
      this.#onChangeSettings(this.#comboSettings.filter((e) => e !== data));
    }
  };

  #changeToggleKey = (data: Combo, detail: string[]) => {
    const key = detail.length > 1 || detail[0].length > 1 ? undefined : detail[0];
    if (data === this.state.newCombo) {
      this.#onChangeNewCombo({ binding: key });
    } else {
      this.#onChangeSettings(
        this.#comboSettings.map((e) => (e === data ? Object.assign(data, { toggleKey: key }) : e)),
      );
    }
  };

  #toggle = (data: Combo) => {
    if (data === this.state.newCombo) {
      this.#onChangeNewCombo({ enabled: !data.enabled });
    } else {
      this.#onChangeSettings(
        this.#comboSettings.map((e) => (e === data ? Object.assign(data, { enabled: !data.enabled }) : e)),
      );
    }
  };

  render = () => {
    const data = this.#data;
    const columns: Columns<Combo> = [
      {
        title: i18n.get('settings.combo.code'),
        dataIndex: 'code',
        render: (data) =>
          data === this.state.newCombo
            ? html`
                <dy-input
                  style="width: 100%"
                  @change=${({ detail }: CustomEvent<string>) => this.#onChangeNewCombo({ code: detail.toUpperCase() })}
                  .value=${data.code}
                ></dy-input>
              `
            : data.code,
      },
      {
        title: i18n.get('settings.cheat.comment'),
        dataIndex: 'comment',
        render: (data) =>
          data === this.state.newCombo
            ? html`
                <dy-input
                  style="width: 100%"
                  @change=${({ detail }: CustomEvent<string>) => this.#onChangeNewCombo({ comment: detail })}
                  .value=${data.comment}
                ></dy-input>
              `
            : data.comment,
      },
      {
        title: i18n.get('settings.cheat.key'),
        dataIndex: 'binding',
        width: '25%',
        render: (data) =>
          html`
            <dy-shortcut-record
              style="width: 100%"
              @change=${({ detail }: CustomEvent<string[]>) => this.#changeToggleKey(data, detail)}
              .value=${data.binding ? [data.binding] : undefined}
            ></dy-shortcut-record>
          `,
      },
      {
        title: i18n.get('settings.cheat.enable'),
        dataIndex: 'enabled',
        width: '100px',
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
        width: '80px',
        style: {
          textAlign: 'right',
        },
        render: (data) =>
          html`
            <dy-space>
              <dy-use
                part="icon"
                ?hidden=${data !== this.state.newCombo}
                @click=${() => this.#addData(data)}
                .element=${icons.check}
              ></dy-use>
              <dy-use part="icon close" @click=${() => this.#removeData(data)} .element=${icons.close}></dy-use>
            </dy-space>
          `,
      },
    ];

    return html`
      <dy-table
        class="list"
        .data=${this.state.newCombo ? [...data, this.state.newCombo] : data}
        .columns=${columns}
        .noData=${' '}
      ></dy-table>
      <dy-button ?disabled=${!!this.state.newCombo} type="reverse" .icon=${icons.add} @click=${this.#addNewCheat}>
        ${i18n.get('settings.cheat.add')}
      </dy-button>
    `;
  };
}
