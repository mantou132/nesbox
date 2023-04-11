import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { ComparerType, comparer } from 'duoyun-ui/lib/utils';

import { BcMsgEvent, BcMsgType, Ram } from 'src/constants';
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
    gap: 1em;
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
  prevRam: Ram;
  ram: Ram;
  quickFilter: ComparerType | '';
  valueFilter: string;
  base: boolean;
  dataViewType: DataViewType;
};

type Row = {
  addr: number;
  prev: number;
  now: number;
};

enum DataViewType {
  U8 = 'u8',
  U16 = 'u16',
  U32 = 'u32',
  F32 = 'f32',
}

/**
 * @customElement p-ramviewer
 */
@customElement('p-ramviewer')
@adoptedStyle(style)
export class PRamviewerElement extends GemElement<State> {
  state: State = {
    currentAddr: new Set(),
    prevRam: { bytes: new Uint8Array(), map: new Uint32Array() },
    ram: { bytes: new Uint8Array(), map: new Uint32Array() },
    quickFilter: '',
    valueFilter: '',
    base: true,
    dataViewType: DataViewType.U8,
  };

  #bc = new BroadcastChannel('');

  #fullData: Row[] = [];
  #data: Row[] = [];

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

  #viewOptions = [
    {
      label: DataViewType.U8,
    },
    {
      label: DataViewType.U16,
    },
    {
      label: DataViewType.U32,
    },
    {
      label: DataViewType.F32,
    },
  ];

  #columns: Column<Row>[] = [
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

  #getRam = async () => {
    const req: BcMsgEvent = { id: performance.now().toString(), type: BcMsgType.RAM_REQ };
    this.#bc.postMessage(req);

    return new Promise<Ram>((resolve) => {
      const handle = ({ data }: MessageEvent<BcMsgEvent>) => {
        if (data.id === req.id && data.data) {
          this.#bc.removeEventListener('message', handle);
          resolve(data.data);
        }
      };
      this.#bc.addEventListener('message', handle);
    });
  };

  #snapshot = async () => {
    const newRam = await this.#getRam();
    const { ram, base } = this.state;
    this.setState({
      ram: newRam,
      prevRam: ram,
      currentAddr: base && this.#data.length ? new Set(this.#data.map((e) => e.addr)) : new Set(),
    });
  };

  #getHexAddr = (v: number) => '0x' + v.toString(16).toLowerCase().padStart(4, '0');

  #getData = (ram: Ram) => {
    const { dataViewType } = this.state;
    switch (dataViewType) {
      case DataViewType.U16:
        return new Uint16Array(ram.bytes.buffer, ram.bytes.byteOffset);
      case DataViewType.U32:
        return new Uint32Array(ram.bytes.buffer, ram.bytes.byteOffset);
      case DataViewType.F32:
        return new Float32Array(ram.bytes.buffer, ram.bytes.byteOffset);
      default:
        return ram.bytes;
    }
  };

  mounted = () => {
    this.#snapshot();
    return () => this.#bc.close();
  };

  willMount = () => {
    this.memo(
      () => {
        const { ram, prevRam } = this.state;
        const data = this.#getData(ram);
        const prevData = this.#getData(prevRam);

        let offsetIndex = 0;
        let offset = ram.map[offsetIndex] || 0;
        const getAddr = (index: number) => {
          const byteIndex = index * data.BYTES_PER_ELEMENT;
          const addr = byteIndex + offset;
          if (addr > ram.map[offsetIndex + 1]) {
            offsetIndex += 2;
            const new_addr = ram.map[offsetIndex];
            if (new_addr === undefined) {
              throw new Error('ram map error');
            }
            offset = new_addr - byteIndex;
            return new_addr;
          } else {
            return addr;
          }
        };
        this.#fullData = [...data].map((v, i) => ({
          addr: getAddr(i),
          prev: prevData[i],
          now: v,
        }));
      },
      () => [this.state.ram],
    );
  };

  render = () => {
    const { quickFilter, valueFilter, base, currentAddr, dataViewType } = this.state;

    this.#data = this.#fullData
      .filter(({ now, addr }) =>
        valueFilter
          ? valueFilter.startsWith('0x')
            ? this.#getHexAddr(addr).includes(valueFilter)
            : Number(valueFilter) == now
          : true,
      )
      .filter(({ now, prev }) => (quickFilter ? comparer(now, quickFilter, prev) : true))
      .filter(({ addr }) => (base && currentAddr.size ? currentAddr.has(addr) : true));

    return html`
      <div class="header">
        <dy-switch
          neutral="informative"
          .checked=${base}
          @change=${({ detail }: CustomEvent<boolean>) => this.setState({ base: detail })}
        >
          Base
        </dy-switch>
        <dy-select
          .options=${this.#viewOptions}
          placeholder="Data View"
          @change=${({ detail }: CustomEvent<DataViewType>) => this.setState({ dataViewType: detail })}
          .value=${dataViewType}
        ></dy-select>
      </div>
      <div class="header">
        <dy-input-group>
          <dy-button color="neutral" @click=${this.#snapshot}>Update</dy-button>
          <dy-button
            small
            type="reverse"
            color="neutral"
            aria-label="Clear"
            .icon=${icons.close}
            @click=${() => {
              this.setState({
                currentAddr: new Set(),
                ram: { bytes: new Uint8Array(), map: new Uint32Array() },
                prevRam: { bytes: new Uint8Array(), map: new Uint32Array() },
                valueFilter: '',
                quickFilter: '',
              });
              this.#snapshot();
            }}
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
          @change=${({ detail }: CustomEvent<string>) =>
            this.setState({ valueFilter: detail.toLowerCase(), quickFilter: '' })}
          @clear=${() => this.setState({ valueFilter: '' })}
          .value=${valueFilter}
        ></dy-input>
      </div>
      <dy-table .rowKey=${'addr'} .data=${this.#data.slice(0, 2048)} .columns=${this.#columns}></dy-table>
    `;
  };
}
