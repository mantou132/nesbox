import {
  AudioComponent,
  MaterialComponent,
  PositionComponent,
  _registeredComponents,
  SelectComponent,
  SizeComponent,
  TextAreaComponent,
} from './components';
import { BasicEntity, Entity } from './entities';
import { Color, COLOR_BLACK, fonts, FontType } from './assets';
import { getLines, mixColor } from './utils';

export class World<CustomData = any> {
  #entities = new Set<Entity>();
  #systems = new Set<(world: World) => void>();
  #audios = new Set<AudioComponent>();

  scene: number | string = '';
  width = 0;
  height = 0;
  fps = 60;
  sampleRate = 41100;
  frameNum = 0;
  data = {} as CustomData;

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
    entity.setParent(this);
    this.#entities.add(entity);
    return this;
  }

  #flatCache?: Entity[] = undefined;
  getEntities(flat = false) {
    if (flat) {
      if (this.#flatCache) return this.#flatCache;
      this.#flatCache = [];
      const handleEntity = (entity: Entity) => {
        this.#flatCache!.push(entity);
        entity.getEntities().forEach((entity) => handleEntity(entity));
      };
      this.#entities.forEach((entity) => handleEntity(entity));
      Promise.resolve().then(() => (this.#flatCache = undefined));
      return this.#flatCache;
    }
    return [...this.#entities];
  }

  removeEntity(entity: Entity) {
    entity.removeParent();
    this.#entities.delete(entity);
    return this;
  }

  addSystem(system: (world: World) => void) {
    this.#systems.add(system);
    return this;
  }

  getSystems() {
    return [...this.#systems];
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

  loadScene(scene: Scene, data?: CustomData) {
    this.#entities.forEach((e) => this.removeEntity(e));
    this.#systems.clear();
    scene.getEntities().forEach((e) => this.addEntity(e));
    scene.getSystems().forEach((e) => this.addSystem(e));
    scene.getAudios().forEach((e) => this.addAudio(e));
    this.scene = scene.scene;
    if (data) this.setData(data);
    return this;
  }

  async switchScene(scene: Scene, data?: CustomData) {
    await Promise.resolve();
    this.loadScene(scene, data);
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
      this.data = object.data;
      this.fps = object.fps;
      this.scene = object.scene;
      this.width = object.width;
      this.height = object.height;
      this.sampleRate = object.sampleRate;
      this.frameNum = object.frameNum;
      object._as.forEach((e) => {
        const audio = new AudioComponent();
        Object.assign(audio, e);
        this.addAudio(audio);
      });
      const parseEntity = (entityObj: ReturnType<Entity['toJSON']>) => {
        const entity = new BasicEntity();
        entityObj._es.forEach((e) => {
          entity.addEntity(parseEntity(e));
        });
        entityObj._cs.forEach((e) => {
          const com = new _registeredComponents[e._ct]();
          Object.entries(e).forEach(([k, v]) => {
            const key = k as keyof typeof com;
            com[key] = com[key] instanceof Color ? new Color(v) : v;
          });
          entity.addComponent(com);
        });
        return entity;
      };
      object._es.forEach((e: any) => {
        this.addEntity(parseEntity(e));
      });
    } catch {
      throw new Error('State format error');
    }
  }

  setData(data: CustomData) {
    this.data = data;
    return this;
  }

  toJSON() {
    return {
      data: this.data,
      fps: this.fps,
      scene: this.scene,
      width: this.width,
      height: this.height,
      sampleRate: this.sampleRate,
      frameNum: this.frameNum,
      _es: this.getEntities().map((e) => e.toJSON()),
      _as: this.getAudios().map((e) => e.toJSON()),
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
      if (yy >= this.height || yy < 0) continue;
      for (let j = 0; j < w; j++) {
        const xx = x + j;
        if (xx >= this.width || xx < 0) continue;
        const index = (yy * this.width + xx) * 4;
        const idx = (i * w + j) * 4;

        const bgColor = new Color(this.#videoFrame.buffer, index, 4);
        const fgColor = color || new Color(array.buffer, idx, 4);
        mixColor(bgColor, fgColor, array[idx + 3]);
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
    const handleEntity = (
      entity: Entity,
      parentPositionX: number,
      parentPositionY: number,
      parentSizeW: number,
      parentSizeH: number,
    ) => {
      const p = entity.getComponent(PositionComponent);
      const px = p?.x || 0;
      const py = p?.y || 0;
      const positionX = px + parentPositionX;
      const positionY = py + parentPositionY;
      const roundPositionX = Math.round(positionX);
      const roundPositionY = Math.round(positionY);
      const s = entity.getComponent(SizeComponent);
      const sw = s?.w || parentSizeW;
      const sh = s?.h || parentSizeH;
      const sizeW =
        parentSizeW +
        sw -
        (Math.max(parentPositionX + parentSizeW, positionX + sw) - Math.min(parentPositionX, positionX));
      const sizeH =
        parentSizeH +
        sh -
        (Math.max(parentPositionY + parentSizeH, positionY + sh) - Math.min(parentPositionY, positionY));

      const material = entity.getComponent(MaterialComponent);
      const color = material?.color || COLOR_BLACK;
      const select = entity.getComponent(SelectComponent);
      const textarea = entity.getComponent(TextAreaComponent);

      if (textarea) {
        getLines(textarea.text, textarea.width, fonts[textarea.fontType]).reduce((y, line) => {
          this.#renderText(line, roundPositionX, y, textarea.fontType, color);
          return y + fonts[textarea.fontType].fontSize * 1.2;
        }, roundPositionY);
      } else if (select) {
        select.options.reduce((y, c, i) => {
          if (select.selected === i) this.#renderText('>', roundPositionX, y, 'default', color);
          this.#renderText(c.text, roundPositionX + fonts.default.fontSize * 1.5, y, 'default', color);
          return y + fonts.default.fontSize * 1.2;
        }, roundPositionY);
      } else if (material) {
        for (let i = 0; i < sizeH; i++) {
          const yy = roundPositionY + i;
          if (yy < 0) continue;
          for (let j = 0; j < sizeW; j++) {
            const xx = roundPositionX + j;
            if (xx < 0) continue;
            const index = (yy * this.width + xx) * 4;
            this.#videoFrame[index] = material.color[0];
            this.#videoFrame[index + 1] = material.color[1];
            this.#videoFrame[index + 2] = material.color[2];
            this.#videoFrame[index + 3] = material.color[3];
          }
        }
      }

      entity.getEntities().forEach((entity) => handleEntity(entity, positionX, positionY, sizeW, sizeH));
    };
    this.getEntities().forEach((entity) => handleEntity(entity, 0, 0, this.width, this.height));
  }
}

export class Scene extends World {
  constructor(label: number | string = '') {
    super(0, 0);
    this.scene = label;
  }
}
