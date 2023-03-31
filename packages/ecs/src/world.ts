import {
  AudioComponent,
  MaterialComponent,
  PositionComponent,
  _registeredComponents,
  SelectComponent,
  SizeComponent,
  TextAreaComponent,
  RenderOnceComponent,
  AnimateComponent,
} from './components';
import { Entity, _registeredEntities } from './entities';
import { Color, COLOR_BLACK, fonts, FontType, sprites } from './assets';
import { getLines, mixColor, entitiesGenerator } from './utils';

export class World<CustomData = any> {
  #entities = new Set<Entity>();
  #idEntities = new Map<string | number, Set<Entity>>();
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

  _registerEntity(entity: Entity, sub: boolean) {
    const reg = (entity: Entity) => {
      entity._setWorld(this);
      const set = this.#idEntities.get(entity.id) || new Set();
      set.add(entity);
      this.#idEntities.set(entity.id, set);
    };
    reg(entity);
    if (sub) {
      for (const e of entity.getEntitiesIter()) {
        reg(e);
      }
    }
  }

  _logoutEntity(entity: Entity, sub: boolean) {
    const logout = (entity: Entity) => {
      entity._removeWorld();
      const set = this.#idEntities.get(entity.id);
      if (set) {
        set.delete(entity);
        if (!set.size) this.#idEntities.delete(entity.id);
      }
    };
    logout(entity);
    if (sub) {
      for (const e of entity.getEntitiesIter()) {
        logout(e);
      }
    }
  }

  getVideoFrame() {
    return this.#videoFrame;
  }
  getAudioFrame() {
    return this.#audioFrame;
  }

  addEntity(entity: Entity) {
    entity.remove();
    entity._setParent(this);
    this._registerEntity(entity, true);
    this.#entities.add(entity);
    return this;
  }

  getEntity<T extends Entity>(id: string | number) {
    return this.#idEntities.get(id)?.values().next().value as T | undefined;
  }

  getEntities<T extends Entity>() {
    return this.#entities as Set<T>;
  }

  getEntitiesIter() {
    return entitiesGenerator(this.getEntities());
  }

  removeEntity(entity: Entity) {
    entity._removeParent();
    this._logoutEntity(entity, true);
    this.#entities.delete(entity);
    return this;
  }

  removeAllEntity() {
    this.#entities.forEach((e) => e.remove());
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

  removeAllSystem() {
    this.#systems.clear();
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

  removeAllAudio() {
    this.#audios.clear();
    return this;
  }

  getAudios() {
    return [...this.#audios];
  }

  loadScene(scene: Scene, data?: CustomData) {
    this.#entities.forEach((e) => this.removeEntity(e));
    this.#audios.clear();
    scene.getEntities().forEach((e) => this.addEntity(e));
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
      this.removeAllAudio();
      object._as.forEach((e) => {
        const audio = new AudioComponent();
        Object.assign(audio, e);
        this.addAudio(audio);
      });
      const parseEntity = (entityObj: ReturnType<Entity['toJSON']>) => {
        const entity = new _registeredEntities[entityObj._et]();
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
        entity.id = entityObj.id;
        return entity;
      };
      this.removeAllEntity();
      object._es.forEach((e) => {
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
      _es: [...this.getEntities()].map((e) => e.toJSON()),
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

  #renderSprite(sprite: { data: Uint8ClampedArray; width: number }, x: number, y: number, color?: Color) {
    const w = sprite.width;
    const h = sprite.data.length / 4 / w;
    for (let i = 0; i < h; i++) {
      const yy = y + i;
      if (yy >= this.height || yy < 0) continue;
      for (let j = 0; j < w; j++) {
        const xx = x + j;
        if (xx >= this.width || xx < 0) continue;
        const index = (yy * this.width + xx) * 4;
        const idx = (i * w + j) * 4;
        const fgA = sprite.data[idx + 3];
        if (fgA === 0) continue;

        const bgColor = new Color(this.#videoFrame.buffer, index, 4);
        const fgColor = color || new Color(sprite.data.buffer, idx, 4);
        mixColor(bgColor, fgColor, fgA);
      }
    }
  }

  #renderSpriteRepeat(
    sprite: { data: Uint8ClampedArray; width: number },
    x: number,
    y: number,
    color?: Color,
    w?: number | false,
    h?: number | false,
  ) {
    const width = sprite.width;
    const height = sprite.data.length / 4 / width;
    const repeatX = w ? w / width : 1;
    const repeatY = h ? h / height : 1;
    for (let i = 0; i < repeatX; i++) {
      for (let j = 0; j < repeatY; j++) {
        this.#renderSprite(sprite, x + i * width, y + j * height, color);
      }
    }
  }

  #renderText(text: string, x: number, y: number, fontType: FontType, color?: Color) {
    return [...text].reduce((x, char) => {
      const sprite = fonts[fontType].fontSet[char];
      this.#renderSprite(sprite, x, y, color);
      return x + sprite.width;
    }, x);
  }

  #renderTextArea(textarea: TextAreaComponent, x: number, y: number, color: Color) {
    getLines(textarea.text, textarea.width, fonts[textarea.fontType]).forEach(({ text, width }, index) => {
      this.#renderText(
        text,
        textarea.center ? Math.round(x + (textarea.width - width) / 2) : x,
        y + index * fonts[textarea.fontType].fontSize * 1.2,
        textarea.fontType,
        color,
      );
    });
  }

  #renderSelect(select: SelectComponent, x: number, y: number, color: Color) {
    const marginLeft = x + fonts[select.fontType].fontSize * 1.5;
    const lineHeight = fonts[select.fontType].fontSize * 1.2;
    select.options.forEach((option, index) => {
      const yy = y + index * lineHeight;
      if (select.selected === index) this.#renderText('>', x, yy, select.fontType, color);
      const endX = this.#renderText(option, marginLeft, yy, select.fontType, color);
      select.setOptionRect(index, [x, yy, endX - x, lineHeight]);
    });
  }

  #renderRect(x: number, y: number, w: number, h: number, color: Color) {
    for (let i = 0; i < h; i++) {
      const yy = y + i;
      if (yy < 0) continue;
      for (let j = 0; j < w; j++) {
        const xx = x + j;
        if (xx < 0) continue;
        const index = (yy * this.width + xx) * 4;
        this.#videoFrame[index] = color[0];
        this.#videoFrame[index + 1] = color[1];
        this.#videoFrame[index + 2] = color[2];
        this.#videoFrame[index + 3] = color[3];
      }
    }
  }

  #renderOnceEntities = new WeakSet<Entity>();
  #render() {
    const handleEntity = (
      entity: Entity,
      parentPositionX: number,
      parentPositionY: number,
      parentSizeW: number,
      parentSizeH: number,
    ) => {
      if (entity.hasComponent(RenderOnceComponent)) {
        if (this.#renderOnceEntities.has(entity)) {
          return;
        } else {
          this.#renderOnceEntities.add(entity);
        }
      } else {
        this.#renderOnceEntities.delete(entity);
      }

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
      const color = material ? material.color : COLOR_BLACK;

      const textarea = entity.getComponent(TextAreaComponent);
      if (textarea) {
        this.#renderTextArea(textarea, roundPositionX, roundPositionY, color);
        return;
      }

      const select = entity.getComponent(SelectComponent);
      if (select) {
        this.#renderSelect(select, roundPositionX, roundPositionY, color);
        return;
      }

      const animate = entity.getComponent(AnimateComponent);
      if (animate) {
        this.#renderSpriteRepeat(
          sprites[animate.getSprite()],
          roundPositionX,
          roundPositionY,
          animate.getColor() || material?.color,
          animate.repeatX && sizeW,
          animate.repeatY && sizeH,
        );
        animate.update();
        return;
      }

      if (material) {
        if (material.sprite || material.sprite === 0) {
          this.#renderSpriteRepeat(
            sprites[material.sprite],
            roundPositionX,
            roundPositionY,
            material.color,
            material.repeatX && sizeW,
            material.repeatY && sizeH,
          );
        } else {
          this.#renderRect(roundPositionX, roundPositionY, sizeW, sizeH, material.color);
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

  addSystem(_system: (world: World<any>) => void): this {
    throw new Error('Should add system at world!');
  }
}
