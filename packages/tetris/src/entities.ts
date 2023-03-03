import {
  Entity,
  MaterialComponent,
  PositionComponent,
  SizeComponent,
  BasicEntity,
  COLOR_RED,
  COLOR_GREEN,
  COLOR_BLUE,
  TextAreaComponent,
} from '@mantou/ecs';
import { PieceComponent } from 'src/components';

import { BRICK_SIZE, BRICK_X_NUMBER, HEIGHT, WIDTH } from 'src/constants';

const colors = [COLOR_RED, COLOR_GREEN, COLOR_BLUE];

export class PieceEntity extends Entity {
  constructor(grid: number[][], label?: string | number) {
    super(label);
    const pieceComponent = new PieceComponent(grid);

    this.addComponent(pieceComponent).addComponent(new PositionComponent(0, 0, 0, BRICK_SIZE));

    const color = colors[Math.round(Math.random() * colors.length)];

    pieceComponent.type.forEach((c, y) => {
      c.forEach((point, x) => {
        if (point) {
          this.addEntity(
            new BasicEntity()
              .addComponent(new PositionComponent(BRICK_SIZE * x, BRICK_SIZE * y))
              .addComponent(new SizeComponent(BRICK_SIZE, BRICK_SIZE))
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

  transformType(type: number[][]) {
    const entities = this.getEntities();
    type.forEach((line, y) => {
      line.forEach((v, x) => {
        if (v) {
          entities
            .pop()!
            .removeComponent(PositionComponent)
            .addComponent(new PositionComponent(BRICK_SIZE * x, BRICK_SIZE * y));
        }
      });
    });
  }
}

export class FailedEntity extends Entity {
  constructor(score: string) {
    super();
    this.addComponent(new PositionComponent(WIDTH / 4, HEIGHT / 4))
      .addComponent(new SizeComponent(WIDTH / 2, HEIGHT / 2))
      .addComponent(new MaterialComponent(COLOR_RED))
      .addEntity(
        new BasicEntity()
          .addComponent(new PositionComponent(5, 50))
          .addComponent(new TextAreaComponent(`FAILED,\nSCORE: ${score}`)),
      );
  }
}
