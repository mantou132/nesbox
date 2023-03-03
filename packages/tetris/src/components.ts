import { Component, registerComponent } from '@mantou/ecs';

const pieceTypeList = [
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [[1, 1, 1, 1]],
];

@registerComponent()
export class PieceComponent extends Component {
  gridX = 0;
  gridY = 0;
  type: number[][];

  static randomType() {
    return pieceTypeList[Math.floor(Math.random() * pieceTypeList.length)].map((e) => [...e]);
  }

  constructor(type?: number[][]) {
    super();
    this.type = type || PieceComponent.randomType();
  }

  get cols() {
    return this.type[0].length;
  }

  get rows() {
    return this.type.length;
  }

  isCollGrid(grid: number[][]) {
    if (this.gridY + this.rows > grid.length || this.gridX + this.cols > grid[0].length) return true;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.type[y][x] && grid[y + this.gridY][x + this.gridX]) {
          return true;
        }
      }
    }
    return false;
  }

  updateGrid(grid: number[][]) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.type[y][x]) {
          grid[y + this.gridY][x + this.gridX] = 1;
        }
      }
    }
  }

  transform(grid: number[][]) {
    const oldType = this.type;
    this.type = Array.from({ length: this.cols }, (_, y) =>
      Array.from({ length: this.rows }, (_, x) => oldType[this.rows - 1 - x][y]),
    );
    if (this.isCollGrid(grid)) {
      this.type = oldType;
    }
  }
}
