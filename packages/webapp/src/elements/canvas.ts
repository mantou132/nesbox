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
  @refobject canvasRef: RefObject<HTMLCanvasElement>;

  get #ctx() {
    return this.canvasRef.element!.getContext('2d')!;
  }

  paint = (frame: Uint8Array) => {
    new Uint8Array(this.#imageData.data.buffer).set(frame);
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

  #imageData: ImageData;
  mounted = () => {
    this.#imageData = this.#ctx!.createImageData(this.#ctx!.canvas.width, this.#ctx!.canvas.height);
  };

  render = () => {
    return html`
      <canvas
        class="canvas"
        width="256"
        height="240"
        ref=${this.canvasRef.ref}
        style=${styleMap({ imageRendering: configure.user?.settings.video.render })}
      ></canvas>
    `;
  };
}
