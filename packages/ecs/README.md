# ECS

A simple JavaScript ECS library for NESBox Sandbox

## Example

```js
const helloWorld = (world) => {
  console.log('hello');
  for (const entity of world.getEntitiesIter()) {
    if (entity.hasComponent(SizeComponent)) {
      // do something...
    }
  }
};

const world = new World(256, 240)
  .addEntity(new BasicEntity().addComponent(new SizeComponent(10, 10)))
  .addSystem(helloWorld);

world.getVideoFrame();
world.getAudioFrame();
world.getState();
```

Custom `Component`:

```js
@registerComponent()
export class NewPieceComponent extends Component {}
```
