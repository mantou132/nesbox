import { World } from './world';
import { Component } from './components';

export abstract class Entity {
  label: number | string = '';
  #entities = new Set<Entity>();
  #components = new Map<typeof Component, Component>();
  #parent?: Entity | World;

  constructor(label: number | string = '') {
    this.label = label;
  }

  setParent(parent: Entity | World) {
    this.#parent = parent;
  }

  removeParent() {
    this.#parent = undefined;
  }

  addEntity(entity: Entity) {
    entity.setParent(this);
    this.#entities.add(entity);
    return this;
  }

  addSiblingEntity(entity: Entity) {
    if (this.#parent) {
      entity.setParent(this.#parent);
      this.#parent.addEntity(entity);
    }
    return this;
  }

  getEntities<T extends Entity>() {
    return [...this.#entities] as T[];
  }

  removeEntity(entity: Entity) {
    entity.removeParent();
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

  getComponents() {
    return [...this.#components].map(([_, v]) => v);
  }

  hasComponent(constructor: typeof Component) {
    return this.#components.has(constructor);
  }

  getComponent<T extends new (...args: any[]) => any>(constructor: T): InstanceType<T> | undefined {
    return this.#components.get(constructor) as InstanceType<T> | undefined;
  }

  removeComponent<T extends new (...args: any[]) => any>(constructor: T) {
    this.#components.delete(constructor);
    return this;
  }

  toJSON(): EntityJSON {
    return {
      label: this.label,
      _et: this.constructor.name,
      _es: this.getEntities().map((e) => e.toJSON()),
      _cs: this.getComponents().map((e) => e.toJSON()),
    };
  }
}

export type EntityJSON = {
  label: string | number;
  _et: string;
  _cs: ReturnType<Component['toJSON']>[];
  _es: EntityJSON[];
};

export const _registeredEntities = {} as Record<string, new <T extends Entity>(...arg: any[]) => T>;

export function registerEntity() {
  // first arg must is label, rest is optional
  return function (cls: new (label?: string | number) => any) {
    _registeredEntities[cls.name] = cls;
  };
}

@registerEntity()
export class BasicEntity extends Entity {}
