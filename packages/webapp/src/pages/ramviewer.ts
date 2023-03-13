import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { ComparerType, comparer } from 'duoyun-ui/lib/utils';

import { BcMsgEvent, BcMsgType } from 'src/constants';
import { icons } from 'src/icons';

import type { Column } from 'duoyun-ui/elements/table';

import 'duoyun-ui/elements/table';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/switch';
import 'duoyun-ui/elements/select';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    height: 0;
    flex-grow: 1;
    padding: 1em;
  }
  .header {
    display: flex;
    gap: 0.5em;
    margin-block-end: 1em;
    font-size: 0.875em;
  }
  dy-table {
    height: 0;
    flex-grow: 1;
    overflow: auto;
  }
`);

type State = {
  currentAddr: Set<number>;
  prevRam: Uint8Array;
  ram: Uint8Array;
  quickFilter: ComparerType | '';
  valueFilter: string;
  base: boolean;
};

type Row = {
  addr: number;
  prev: number;
  now: number;
};

/**
 * @customElement p-ramviewer
 */
@customElement('p-ramviewer')
@adoptedStyle(style)
export class PRamviewerElement extends GemElement<State> {
  state: State = {
    currentAddr: new Set(),
    prevRam: new Uint8Array(),
    ram: new Uint8Array(),
    quickFilter: '',
    valueFilter: '',
    base: true,
  };

  #bc = new BroadcastChannel('');

  #getRam = async () => {
    const req: BcMsgEvent = { id: performance.now().toString(), type: BcMsgType.RAM_REQ };
    this.#bc.postMessage(req);

    return new Promise<Uint8Array>((resolve) => {
      const handle = ({ data }: MessageEvent<BcMsgEvent>) => {
        if (data.id === req.id) {
          this.#bc.removeEventListener('message', handle);
          resolve(data.data!);
        }
      };
      this.#bc.addEventListener('message', handle);
    });
  };

  #data: Row[] = [];

  #getSnapshot = async () => {
    const buffer = await this.#getRam();
    this.setState({
      ram: buffer,
      prevRam: this.state.ram,
      currentAddr: this.state.base && this.#data.length ? new Set(this.#data.map((e) => e.addr)) : new Set(),
    });
  };

  #filterOptions = [
    {
      label: 'None',
      value: '',
    },
    {
      label: 'Eq',
      value: ComparerType.Eq,
    },
    {
      label: 'Ne',
      value: ComparerType.Ne,
    },
    {
      label: 'Gt',
      value: ComparerType.Gt,
    },
    {
      label: 'Gte',
      value: ComparerType.Gte,
    },
    {
      label: 'Lt',
      value: ComparerType.Lt,
    },
    {
      label: 'Lte',
      value: ComparerType.Lte,
    },
  ];

  #getHexAddr = (v: number) => '0x' + v.toString(16).toUpperCase().padStart(4, '0');

  mounted = () => {
    this.#getSnapshot();
    return () => this.#bc.close();
  };

  render = () => {
    const { ram, prevRam, quickFilter, valueFilter, base, currentAddr } = this.state;
    this.#data = [...ram]
      .map((v, i) => ({
        // ram 2k + sram 8k
        addr: i > 2047 ? i - 2048 + 0x6000 : i,
        prev: prevRam[i],
        now: v,
      }))
      .filter(({ now, addr }) =>
        valueFilter
          ? valueFilter.startsWith('0x')
            ? this.#getHexAddr(addr).includes(valueFilter)
            : Number(valueFilter) == now
          : true,
      )
      .filter(({ now, prev }) => (quickFilter ? comparer(now, quickFilter, prev) : true))
      .filter(({ addr }) => (base && currentAddr.size ? currentAddr.has(addr) : true));

    const columns: Column<Row>[] = [
      {
        title: 'Addr(HEX)',
        dataIndex: 'addr',
        render: ({ addr }) => this.#getHexAddr(addr),
      },
      {
        title: 'Now',
        dataIndex: 'now',
        style: {
          textAlign: 'center',
        },
      },
      {
        title: 'Prev',
        dataIndex: 'prev',
        style: {
          textAlign: 'center',
        },
      },
    ];
    return html`
      <div class="header">
        <dy-input-group>
          <dy-button color="neutral" @click=${this.#getSnapshot}>Update</dy-button>
          <dy-button
            small
            type="reverse"
            color="neutral"
            .icon=${icons.close}
            @click=${() => this.setState({ currentAddr: new Set(), valueFilter: '', quickFilter: '' })}
          ></dy-button>
        </dy-input-group>
        <dy-select
          .options=${this.#filterOptions}
          placeholder="Quick Filter"
          @change=${({ detail }: CustomEvent<ComparerType>) => this.setState({ quickFilter: detail, valueFilter: '' })}
          .value=${quickFilter}
        ></dy-select>
        <dy-input
          placeholder="Addr/Value Filter"
          clearable
          @change=${({ detail }: CustomEvent<string>) => this.setState({ valueFilter: detail, quickFilter: '' })}
          @clear=${() => this.setState({ valueFilter: '' })}
          .value=${valueFilter}
        ></dy-input>
        <dy-switch
          neutral="informative"
          .checked=${base}
          @change=${({ detail }: CustomEvent<boolean>) => this.setState({ base: detail })}
        >
          Base
        </dy-switch>
      </div>
      <dy-table .rowKey=${'addr'} .data=${this.#data.slice(0, 2048)} .columns=${columns}></dy-table>
    `;
  };
}
