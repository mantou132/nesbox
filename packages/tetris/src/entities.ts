import {
  Entity,
  MaterialComponent,
  PositionComponent,
  SizeComponent,
  BasicEntity,
  TextAreaComponent,
  Color,
  COLOR_WHITE,
} from '@mantou/ecs';
import { NewPieceComponent, PieceComponent } from 'src/components';

import {
  BRICK_SIZE,
  BRICK_X_NUMBER,
  BORDER_COLOR,
  HEIGHT,
  STAGE_BACKGROUND_COLOR,
  WIDTH,
  SCORE_COLOR,
} from 'src/constants';

const colors = [
  new Color(255, 0, 0),
  new Color(188, 108, 0),
  new Color(147, 126, 0),
  new Color(68, 144, 0),
  new Color(0, 145, 110),
  new Color(0, 141, 155),
  new Color(0, 134, 198),
  new Color(88, 114, 255),
  new Color(183, 66, 255),
  new Color(240, 0, 161),
];

export class PieceEntity extends Entity {
  constructor(grid: number[][], label?: string | number) {
    super(label);
    const pieceComponent = new PieceComponent(grid);

    this.addComponent(new NewPieceComponent()).addComponent(pieceComponent).addComponent(new PositionComponent());

    const color = colors[Math.floor(Math.random() * colors.length)];

    pieceComponent.type.forEach((c, y) => {
      c.forEach((point, x) => {
        if (point) {
          this.addEntity(
            new BasicEntity()
              .addComponent(new PositionComponent(BRICK_SIZE * x, BRICK_SIZE * y))
              .addComponent(new SizeComponent(BRICK_SIZE - 1, BRICK_SIZE - 1))
              .addComponent(new MaterialComponent(color)),
          );
        }
      });
    });
  }

  transformX() {
    const pieceComponent = this.getComponent(PieceComponent)!;
    const positionComponent = this.getComponent(PositionComponent)!;
    pieceComponent.gridX = Math.round(BRICK_X_NUMBER / 2 - pieceComponent.cols / 2);
    positionComponent.x = pieceComponent.gridX * BRICK_SIZE;
    return this;
  }

  removeBrickFromLine(lineNum: number) {
    const pieceComponent = this.getComponent(PieceComponent)!;
    const positionComponent = this.getComponent(PositionComponent)!;
    if (pieceComponent.gridY > lineNum) return;

    if (pieceComponent.gridY + pieceComponent.rows <= lineNum) {
      pieceComponent.gridY++;
      positionComponent.y += BRICK_SIZE;
    } else {
      this.getEntities().forEach((entity) => {
        const position = entity.getComponent(PositionComponent)!;
        const y = (lineNum - pieceComponent.gridY) * BRICK_SIZE;
        if (position.y === y) {
          entity.remove();
        } else if (position.y < y) {
          position.y += BRICK_SIZE;
        }
      });
    }
  }

  transform(grid: number[][]) {
    const pieceComponent = this.getComponent(PieceComponent)!;
    const positionComponent = this.getComponent(PositionComponent)!;
    const entities = this.getEntities();

    pieceComponent.transform(grid);

    positionComponent.x = pieceComponent.gridX * BRICK_SIZE;
    positionComponent.y = pieceComponent.gridY * BRICK_SIZE;

    pieceComponent.type.forEach((line, y) => {
      line.forEach((v, x) => {
        if (v) {
          entities
            .pop()!
            .removeComponent(PositionComponent)
            .addComponent(new PositionComponent(BRICK_SIZE * x, BRICK_SIZE * y));
        }
      });
    });
    return this;
  }

  update() {
    const pieceComponent = this.getComponent(PieceComponent)!;
    const positionComponent = this.getComponent(PositionComponent)!;

    const originPieceGridX = pieceComponent.gridX;
    const originPieceGridY = pieceComponent.gridY;

    positionComponent.update();
    pieceComponent.gridX = positionComponent.x / BRICK_SIZE;
    pieceComponent.gridY = positionComponent.y / BRICK_SIZE;
    return () => {
      positionComponent.restore();
      pieceComponent.gridX = originPieceGridX;
      pieceComponent.gridY = originPieceGridY;
    };
  }
}

export class FailedEntity extends Entity {
  constructor(score: string) {
    super();
    this.addComponent(new PositionComponent(WIDTH / 4, HEIGHT / 4))
      .addComponent(new SizeComponent(WIDTH / 2, HEIGHT / 2))
      .addComponent(new MaterialComponent(BORDER_COLOR))
      .addEntity(
        new BasicEntity()
          .addComponent(new PositionComponent(2, 2))
          .addComponent(new SizeComponent(WIDTH / 2 - 4, HEIGHT / 2 - 4))
          .addComponent(new MaterialComponent(STAGE_BACKGROUND_COLOR))
          .addEntity(
            new BasicEntity()
              .addComponent(new PositionComponent(0, 40))
              .addComponent(new MaterialComponent(COLOR_WHITE))
              .addComponent(
                new TextAreaComponent(`GAME OVER!`, { width: WIDTH / 2 - 4, fontType: 'heading', center: true }),
              ),
          )
          .addEntity(
            new BasicEntity()
              .addComponent(new PositionComponent(0, 60))
              .addComponent(new MaterialComponent(SCORE_COLOR))
              .addComponent(
                new TextAreaComponent(`SCORE: ${score}`, { width: WIDTH / 2 - 4, fontType: 'default', center: true }),
              ),
          ),
      );
  }
}
