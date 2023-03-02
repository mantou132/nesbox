import { Component } from './components';

export abstract class Entity {
  label = '';
  #entities = new Set<Entity>();
  #components = new Map<typeof Component, Component>();

  constructor(label = '') {
    this.label = label;
  }

  addEntity(entity: Entity) {
    this.#entities.add(entity);
    return this;
  }

  getEntities() {
    return [...this.#entities];
  }

  removeEntity(entity: Entity) {
    this.#entities.delete(entity);
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
    this.#components.has(constructor);
    return this;
  }

  getComponent<T extends new (...args: any[]) => any>(constructor: T): InstanceType<T> | undefined {
    return this.#components.get(constructor) as InstanceType<T> | undefined;
  }

  toJSON(): EntityJSON {
    return {
      label: this.label,
      _entities: this.getEntities().map((e) => e.toJSON()),
      _components: this.getComponents().map((e) => e.toJSON()),
    };
  }
}

export type EntityJSON = { label: string; _components: ReturnType<Component['toJSON']>[]; _entities: EntityJSON[] };

export class BasicEntity extends Entity {}
