import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  RefObject,
  refobject,
  numattribute,
  attribute,
} from '@mantou/gem';
import { BaseDirectory } from '@tauri-apps/api/fs';
import { Time } from 'duoyun-ui/lib/time';
import { saveFile } from 'src/utils';

import { VideoFilter } from 'src/constants';
import { logger } from 'src/logger';
import normalVert from 'src/shaders/normal.vert?raw';

const getShader = (filter: VideoFilter) => {
  switch (filter) {
    case VideoFilter.NTSC: {
      return import('src/shaders/ntsc.frag?raw');
    }
    case VideoFilter.CRT: {
      return import('src/shaders/crt.frag?raw');
    }
    default: {
      return import('src/shaders/normal.frag?raw');
    }
  }
};

const ortho = (left: number, right: number, bottom: number, top: number): number[] => {
  // prettier-ignore
  const m = [
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
  ];
  m[0 * 4 + 0] = 2.0 / (right - left);
  m[1 * 4 + 1] = 2.0 / (top - bottom);
  m[3 * 4 + 0] = ((right + left) / (right - left)) * -1.0;
  m[3 * 4 + 1] = ((top + bottom) / (top - bottom)) * -1.0;
  return m;
};

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
export class NesboxCanvasElement extends GemElement {
  @numattribute width: number;
  @numattribute height: number;
  @attribute filter: VideoFilter;
  @refobject canvasRef: RefObject<HTMLCanvasElement>;

  #scale = 2;

  get #renderWidth() {
    return this.width * this.#scale;
  }

  get #renderHeight() {
    return this.height * this.#scale;
  }

  // https://github.com/lukexor/tetanes/blob/main/web/www/src/index.ts#L60
  #webgl?: WebGL2RenderingContext;
  #time_uniform: WebGLUniformLocation | null;
  #frame_uniform: WebGLUniformLocation | null;
  #frame = 1;
  #setupWebGL = async () => {
    const width = this.width;
    const height = this.height;
    const max_size = Math.max(width, height);

    const webgl = this.canvasRef.element!.getContext('webgl2');

    if (!webgl) {
      logger.error('WebGL rendering context not found.');
      return null;
    }

    const vertShader = webgl.createShader(webgl.VERTEX_SHADER);
    const fragShader = webgl.createShader(webgl.FRAGMENT_SHADER);

    if (!vertShader || !fragShader) {
      logger.error('WebGL shader creation failed.');
      return null;
    }

    webgl.shaderSource(vertShader, normalVert);
    webgl.shaderSource(fragShader, (await getShader(this.filter)).default);
    webgl.compileShader(vertShader);
    webgl.compileShader(fragShader);

    if (!webgl.getShaderParameter(vertShader, webgl.COMPILE_STATUS)) {
      logger.error('WebGL vertex shader compilation failed:', webgl.getShaderInfoLog(vertShader));
      return null;
    }
    if (!webgl.getShaderParameter(fragShader, webgl.COMPILE_STATUS)) {
      logger.error('WebGL fragment shader compilation failed:', webgl.getShaderInfoLog(fragShader));
      return null;
    }

    const program = webgl.createProgram();
    if (!program) {
      logger.error('WebGL program creation failed.');
      return null;
    }

    webgl.attachShader(program, vertShader);
    webgl.attachShader(program, fragShader);
    webgl.linkProgram(program);
    if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
      logger.error('WebGL program linking failed!');
      return null;
    }

    webgl.useProgram(program);

    const vertex_attr = webgl.getAttribLocation(program, 'a_position');
    const texcoord_attr = webgl.getAttribLocation(program, 'a_texcoord');
    webgl.enableVertexAttribArray(vertex_attr);
    webgl.enableVertexAttribArray(texcoord_attr);

    const samplerUint = 0;
    const sampler_uniform = webgl.getUniformLocation(program, 'u_sampler');
    webgl.uniform1i(sampler_uniform, samplerUint);

    const matrix_uniform = webgl.getUniformLocation(program, 'u_matrix');
    webgl.uniformMatrix4fv(matrix_uniform, false, ortho(0.0, width, height, 0.0));

    const resolution_uniform = webgl.getUniformLocation(program, 'u_resolution');
    if (resolution_uniform) webgl.uniform3f(resolution_uniform, this.width, this.height, 1);

    // deps on frame uniforms
    this.#time_uniform = webgl.getUniformLocation(program, 'u_time');
    this.#frame_uniform = webgl.getUniformLocation(program, 'u_frame');

    const texture = webgl.createTexture();
    webgl.activeTexture(webgl.TEXTURE0 + samplerUint);
    webgl.bindTexture(webgl.TEXTURE_2D, texture);
    webgl.texImage2D(
      webgl.TEXTURE_2D,
      0,
      webgl.RGBA,
      max_size,
      max_size,
      0,
      webgl.RGBA,
      webgl.UNSIGNED_BYTE,
      new Uint8Array(max_size * max_size * 4),
    );
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);

    const vertex_buffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, vertex_buffer);
    // prettier-ignore
    const vertices = [
      0.0, 0.0,
      0.0, height,
      width, 0.0,
      width, height,
    ];
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(vertices), webgl.STATIC_DRAW);
    webgl.vertexAttribPointer(vertex_attr, 2, webgl.FLOAT, false, 0, 0);

    const texcoord_buffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, texcoord_buffer);
    // prettier-ignore
    const texcoords = [
      0.0, 0.0,
      0.0, height / width,
      1.0, 0.0,
      1.0, height / width,
    ];
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(texcoords), webgl.STATIC_DRAW);
    webgl.vertexAttribPointer(texcoord_attr, 2, webgl.FLOAT, false, 0, 0);

    const index_buffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, index_buffer);
    // vertices index
    // prettier-ignore
    const indices = [
      0, 1, 2,
      2, 3, 1,
    ];
    webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), webgl.STATIC_DRAW);

    webgl.clear(webgl.COLOR_BUFFER_BIT);
    webgl.enable(webgl.DEPTH_TEST);
    webgl.viewport(0, 0, this.#renderWidth, this.#renderHeight);

    return webgl;
  };

  paint = (frame: Uint8Array, part?: number[]) => {
    if (!this.#webgl) return;

    if (this.#time_uniform) {
      this.#webgl.uniform1f(this.#time_uniform, performance.now());
    }
    if (this.#frame_uniform) {
      this.#webgl.uniform1i(this.#frame_uniform, this.#frame++);
    }

    // only support full width
    const [x, y, __, h] = part || [0, 0, this.width, this.height];
    this.#webgl.texSubImage2D(
      this.#webgl.TEXTURE_2D,
      0,
      x,
      y,
      this.width,
      h,
      this.#webgl.RGBA,
      this.#webgl.UNSIGNED_BYTE,
      frame,
    );
    this.#webgl.drawElements(this.#webgl.TRIANGLES, 6, this.#webgl.UNSIGNED_SHORT, 0);

    this.#tasks.forEach((task) => task());
    this.#tasks.length = 0;
  };

  #screenshot = () => {
    return new Promise<BaseDirectory | undefined>((res) => {
      this.canvasRef.element!.toBlob(
        (blob) => blob && res(saveFile(new File([blob], `Screenshot ${new Time().format()}.png`))),
        'image/png',
        1,
      );
    });
  };

  #tasks: (() => void)[] = [];

  screenshot = () => {
    return new Promise((res, rej) => {
      this.#tasks.push(async () => {
        try {
          res(await this.#screenshot());
        } catch (err) {
          rej(err);
        }
      });
    });
  };

  captureThumbnail = () => {
    return new Promise<string>((res) => {
      this.#tasks.push(() => {
        res(this.canvasRef.element!.toDataURL('image/png', 0.5));
      });
    });
  };

  mounted = () => {
    this.effect(async () => {
      if (this.width) {
        const webgl = await this.#setupWebGL();
        if (webgl) {
          this.#webgl = webgl;
        }
      }
    });
  };

  render = () => {
    return html`
      <canvas class="canvas" width=${this.#renderWidth} height=${this.#renderHeight} ref=${this.canvasRef.ref}></canvas>
    `;
  };
}
