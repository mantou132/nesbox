import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  RefObject,
  refobject,
  numattribute,
} from '@mantou/gem';
import { BaseDirectory } from '@tauri-apps/api/fs';
import { Time } from 'duoyun-ui/lib/time';
import { saveFile } from 'src/utils';

import { configure } from 'src/configure';

const style = createCSSSheet(css`
  :host {
    display: block;
    box-sizing: border-box;
  }
  canvas {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`);

/**
 * @customElement nesbox-canvas
 */
@adoptedStyle(style)
@customElement('nesbox-canvas')
@connectStore(configure)
export class NesboxCanvasElement extends GemElement {
  @numattribute width: number;
  @numattribute height: number;
  @refobject canvasRef: RefObject<HTMLCanvasElement>;

  paint = (frame: Uint8Array, part?: number[]) => {
    if (!this.#imageData) return;
    const { data } = this.#imageData;
    if (part) {
      const [x, y, _, h] = part;
      // NOTE: current only support full width
      const w = this.width;
      for (let i = 0; i < h; i++) {
        const line = new Uint8Array(frame.buffer, frame.byteOffset + i * w * 4, w * 4);
        data.set(line, ((i + y) * this.width + x) * 4);
      }
    } else {
      data.set(frame);
    }
    this.canvasRef.element!.getContext('2d')!.putImageData(this.#imageData, 0, 0);
  };

  screenshot = () => {
    return new Promise<BaseDirectory | undefined>((res) => {
      this.canvasRef.element!.toBlob(
        (blob) => blob && res(saveFile(new File([blob], `Screenshot ${new Time().format()}.png`))),
        'image/png',
        1,
      );
    });
  };

  captureThumbnail = () => {
    return this.canvasRef.element!.toDataURL('image/png', 0.5);
  };

  #imageData?: ImageData;
  mounted = () => {
    this.effect(() => {
      if (this.width) {
        this.#imageData = new ImageData(this.width, this.height);
      }
    });
  };

  render = () => {
    return html`<canvas class="canvas" width=${this.width} height=${this.height} ref=${this.canvasRef.ref}></canvas>`;
  };
}
