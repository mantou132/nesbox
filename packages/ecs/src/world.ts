import {
  AudioComponent,
  MaterialComponent,
  PositionComponent,
  registeredComponents,
  SelectComponent,
  SizeComponent,
  TextAreaComponent,
} from './components';
import { BasicEntity, Entity } from './entities';
import { Color, COLOR_BLACK, fonts, FontType } from './assets';
import { getLines, mixColor } from './utils';

export class World {
  #entities = new Set<Entity>();
  #systems = new Set<(world: World) => void>();
  #audios = new Set<AudioComponent>();

  scene = '';
  width = 0;
  height = 0;
  fps = 60;
  sampleRate = 41100;
  frameNum = 0;

  #videoFrame = new Uint8ClampedArray();
  #audioFrame = new Float32Array();

  constructor(width: number, height: number, fps = 60) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.#videoFrame = new Uint8ClampedArray(4 * width * height);
    this.#audioFrame = new Float32Array(this.sampleRate / fps);
  }

  getVideoFrame() {
    return this.#videoFrame;
  }
  getAudioFrame() {
    return this.#audioFrame;
  }

  addEntity(entity: Entity) {
    this.#entities.add(entity);
    return this;
  }

  getEntities() {
    return [...this.#entities];
  }

  addSystem(system: (world: World) => void) {
    this.#systems.add(system);
    return this;
  }

  getSystems() {
    return [...this.#systems];
  }

  removeEntity(entity: Entity) {
    this.#entities.delete(entity);
    return this;
  }

  removeSystem(system: (world: World) => void) {
    this.#systems.delete(system);
    return this;
  }

  addAudio(audio: AudioComponent) {
    this.#audios.add(audio);
    return this;
  }

  removeAudio(audio: AudioComponent) {
    this.#audios.delete(audio);
    return this;
  }

  getAudios() {
    return [...this.#audios];
  }

  switchScene(scene: Scene) {
    Promise.resolve().then(() => {
      this.#entities.clear();
      this.#systems.clear();
      scene.getEntities().forEach((e) => this.addEntity(e));
      scene.getSystems().forEach((e) => this.addSystem(e));
      scene.getAudios().forEach((e) => this.addAudio(e));
      this.scene = scene.scene;
    });
    return this;
  }

  getState() {
    return new Uint8Array(Uint16Array.from(JSON.stringify(this.toJSON()), (v) => v.charCodeAt(0)).buffer);
  }

  setState(state: Uint8Array) {
    try {
      const object: ReturnType<World['toJSON']> = JSON.parse(
        new Uint16Array(state.buffer).reduce((p, c) => p + String.fromCharCode(c), ''),
      );
      this.fps = object.fps;
      this.scene = object.scene;
      this.width = object.width;
      this.height = object.height;
      this.sampleRate = object.sampleRate;
      this.frameNum = object.frameNum;
      object._audios.forEach((e) => {
        this.addAudio(new AudioComponent(e.type, e.loop, e.offsetBytes));
      });
      const parseEntity = (entityObj: ReturnType<Entity['toJSON']>) => {
        const entity = new BasicEntity();
        entityObj._entities.forEach((e) => {
          entity.addEntity(parseEntity(e));
        });
        entityObj._components.forEach((e) => {
          const com = new registeredComponents[e._componentType]();
          Object.entries(e).forEach(([k, v]) => {
            const key = k as keyof typeof com;
            com[key] = com[key] instanceof Color ? new Color(v) : v;
          });
          entity.addComponent(com);
        });
        return entity;
      };
      object._entities.forEach((e: any) => {
        this.addEntity(parseEntity(e));
      });
    } catch {
      throw new Error('State format error');
    }
  }

  toJSON() {
    return {
      fps: this.fps,
      scene: this.scene,
      width: this.width,
      height: this.height,
      sampleRate: this.sampleRate,
      frameNum: this.frameNum,
      _entities: this.getEntities().map((e) => e.toJSON()),
      _audios: this.getAudios().map((e) => e.toJSON()),
    };
  }

  update() {
    this.#systems.forEach((e) => e(this));
    this.#render();
    this.#playAudio();
    this.frameNum++;
    return this;
  }

  #playAudio() {
    this.#audioFrame.fill(0);
    this.#audios.forEach((e) => {
      const array = e.getFrame(this);
      array.forEach((v, i) => {
        this.#audioFrame[i] += v;
      });
    });
  }

  #renderSprite(array: Uint8ClampedArray, x: number, y: number, w: number, color?: Color) {
    const h = array.length / 4 / w;
    for (let i = 0; i < h; i++) {
      const yy = y + i;
      if (yy >= this.height) break;
      for (let j = 0; j < w; j++) {
        const xx = x + j;
        if (xx >= this.width) break;
        const index = (yy * this.width + xx) * 4;
        const idx = (i * w + j) * 4;

        const bgColor = new Color(this.#videoFrame.buffer, index, 4);
        const fgColor = color || new Color(array.buffer, idx, 4);
        fgColor[3] = array[idx + 3];
        mixColor(bgColor, fgColor);
      }
    }
  }

  #renderText(text: string, x: number, y: number, fontType: FontType, color?: Color) {
    [...text].reduce((x, char) => {
      const sprite = fonts[fontType].fontSet[char];
      this.#renderSprite(sprite.data, x, y, sprite.width, color);
      return x + sprite.width;
    }, x);
  }

  #render() {
    const handleEntity = (entity: Entity, parentPosition: number[], parentSize: number[]) => {
      const p = entity.getComponent(PositionComponent);
      const position = p ? [p.x + parentPosition[0], p.y + parentPosition[1]] : parentPosition;
      const s = entity.getComponent(SizeComponent);
      const size = [
        Math.min(parentSize[0] - (position[0] - parentPosition[0]), s?.w || parentSize[0]),
        Math.min(parentSize[1] - (position[1] - parentPosition[1]), s?.h || parentSize[1]),
      ];

      const material = entity.getComponent(MaterialComponent);
      const select = entity.getComponent(SelectComponent);
      const color = material?.color || COLOR_BLACK;
      if (select) {
        select.options.reduce((y, c, i) => {
          if (select.selected === i) this.#renderText('>', position[0], y, 'default', color);
          this.#renderText(c.text, position[0] + fonts.default.fontSize * 1.5, y, 'default', color);
          return y + fonts.default.fontSize * 1.2;
        }, position[1]);
      } else if (material) {
        for (let i = 0; i < size[1]; i++) {
          for (let j = 0; j < size[0]; j++) {
            const index = ((i + position[1]) * this.width + j + position[0]) * 4;
            this.#videoFrame[index] = material.color[0];
            this.#videoFrame[index + 1] = material.color[1];
            this.#videoFrame[index + 2] = material.color[2];
            this.#videoFrame[index + 3] = material.color[3];
          }
        }
      }

      const textarea = entity.getComponent(TextAreaComponent);
      if (textarea) {
        getLines(textarea.text, textarea.width, fonts[textarea.fontType]).reduce((y, line) => {
          this.#renderText(line, position[0], y, textarea.fontType);
          return y + fonts[textarea.fontType].fontSize * 1.2;
        }, position[1]);
      }

      entity.getEntities().forEach((entity) => handleEntity(entity, position, size));
    };
    this.getEntities().forEach((entity) => handleEntity(entity, [0, 0], [this.width, this.height]));
  }
}

export class Scene extends World {
  constructor(label = '') {
    super(0, 0);
    this.scene = label;
  }
}
