import type { Component } from './components';
import { entitiesGenerator } from './utils';
import type { World } from './world';

export abstract class Entity {
  #id: number | string = '';
  #entities = new Set<Entity>();
  #components = new Map<typeof Component, Component>();
  #parent?: Entity | World;
  #world?: World;

  get id() {
    return this.#id;
  }

  set id(id) {
    // `_logoutEntity` will call `this._removeWorld`
    const world = this.#world;
    world?._logoutEntity(this, false);
    this.#id = id;
    world?._registerEntity(this, false);
  }

  constructor(id: number | string = '') {
    this.#id = id;
  }

  _setWorld(world: World) {
    this.#world = world;
  }

  _removeWorld() {
    this.#world = undefined;
  }

  _setParent(parent: Entity | World) {
    this.#parent = parent;
  }

  _removeParent() {
    this.#parent = undefined;
  }

  addEntity(entity: Entity) {
    entity.remove();
    entity._setParent(this);
    this.#world?._registerEntity(entity, true);
    this.#entities.add(entity);
    return this;
  }

  addSiblingEntity(entity: Entity) {
    this.#parent?.addEntity(entity);
    return this;
  }

  getEntities<T extends Entity>() {
    return this.#entities as Set<T>;
  }

  getEntitiesIter() {
    return entitiesGenerator(this.getEntities());
  }

  removeEntity(entity: Entity) {
    entity._removeParent();
    this.#world?._logoutEntity(entity, true);
    this.#entities.delete(entity);
    return this;
  }

  removeAllEntity() {
    this.#entities.forEach((e) => e.remove());
    return this;
  }

  remove() {
    this.#parent?.removeEntity(this);
    return this;
  }

  addComponent(com: Component) {
    this.#components.set(com.constructor as typeof Component, com);
    return this;
  }

  hasComponent(con: typeof Component) {
    return this.#components.has(con);
  }

  getComponent<T extends new (...args: any[]) => any>(con: T): InstanceType<T> | undefined {
    return this.#components.get(con) as InstanceType<T> | undefined;
  }

  removeComponent<T extends new (...args: any[]) => any>(con: T) {
    this.#components.delete(con);
    return this;
  }

  toJSON(): EntityJSON {
    return {
      id: this.id,
      _et: this.constructor.name,
      _es: [...this.#entities].map((e) => e.toJSON()),
      _cs: [...this.#components.values()].map((e) => e.toJSON()),
    };
  }
}

export type EntityJSON = {
  id: string | number;
  _et: string;
  _cs: ReturnType<Component['toJSON']>[];
  _es: EntityJSON[];
};

export const _registeredEntities = {} as Record<string, new <T extends Entity>(...arg: any[]) => T>;

export function registerEntity() {
  // first arg must is id, rest is optional
  return (cls: new (id?: string | number) => any) => {
    _registeredEntities[cls.name] = cls;
  };
}

@registerEntity()
export class BasicEntity extends Entity {}
