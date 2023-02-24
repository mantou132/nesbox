import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  styleMap,
  connectStore,
  RefObject,
  refobject,
  numattribute,
} from '@mantou/gem';
import { BaseDirectory } from '@tauri-apps/api/fs';
import { Time } from 'duoyun-ui/lib/time';

import { configure } from 'src/configure';
import { saveFile } from 'src/utils';

const style = createCSSSheet(css`
  :host {
    display: block;
  }
  canvas {
    width: 100%;
    height: 100%;
    object-fit: inherit;
  }
`);

/**
 * @customElement nesbox-canvas
 */
@customElement('nesbox-canvas')
@adoptedStyle(style)
@connectStore(configure)
export class NesboxCanvasElement extends GemElement {
  @numattribute width: number;
  @numattribute height: number;
  @refobject canvasRef: RefObject<HTMLCanvasElement>;

  get #ctx() {
    return this.canvasRef.element!.getContext('2d')!;
  }

  paint = (frame: Uint8Array, part?: number[]) => {
    if (!this.#imageData) return;
    const { data } = this.#imageData;
    if (part) {
      // Why not work?
      // const [x, y, w, h] = part;
      // for (let i = 0; i < h; i++) {
      //   const line = new Uint8Array(frame.buffer, i * w * 4, w * 4);
      //   data.set(line, ((i + y) * this.width + x) * 4);
      // }
      const [x, y, ww, _h] = part;
      const w = ww || this.width;
      const width = this.width;
      for (let i = 0; i < frame.length; i += 4) {
        const xx = x + ((i / 4) % w);
        const yy = y + Math.trunc(i / 4 / w);
        const index = (xx + yy * width) * 4;
        [data[index], data[index + 1], data[index + 2], data[index + 3]] = [
          frame[i],
          frame[i + 1],
          frame[i + 2],
          frame[i + 3],
        ];
      }
    } else {
      data.set(frame);
    }
    this.#ctx.putImageData(this.#imageData, 0, 0);
  };

  screenshot = () => {
    return new Promise<BaseDirectory | undefined>((res) => {
      this.#ctx.canvas.toBlob(
        (blob) => blob && res(saveFile(new File([blob], `Screenshot ${new Time().format()}.png`))),
        'image/png',
        1,
      );
    });
  };

  captureThumbnail = () => {
    return this.#ctx.canvas.toDataURL('image/png', 0.5);
  };

  #imageData?: ImageData;
  mounted = () => {
    this.effect(() => {
      if (this.width) {
        this.#imageData = this.#ctx!.createImageData(this.width, this.height);
      }
    });
  };

  render = () => {
    return html`
      <canvas
        class="canvas"
        width=${this.width}
        height=${this.height}
        ref=${this.canvasRef.ref}
        style=${styleMap({ imageRendering: configure.user?.settings.video.render })}
      ></canvas>
    `;
  };
}
