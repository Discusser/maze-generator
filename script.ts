enum Status {
  VISITED = 1,
  EXPLORED = 2,
}

type Wall = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

type Maze = {
  grid: number[][];
  walls: Wall[][];
  cellSize: number;
};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

function neighbors(grid: number[][], cell: number[]) {
  const neighbors = [
    [cell[0] + 1, cell[1]],
    [cell[0] - 1, cell[1]],
    [cell[0], cell[1] + 1],
    [cell[0], cell[1] - 1],
  ];
  return neighbors.filter(
    (neighbor) => neighbor[0] >= 0 && neighbor[0] < grid.length && neighbor[1] >= 0 && neighbor[1] < grid[0].length,
  );
}

function drawCells(maze: Maze) {
  const { grid, cellSize } = maze;
  for (let cx = 0; cx < grid.length; cx++) {
    for (let cy = 0; cy < grid[cx].length; cy++) {
      const x = cx * cellSize;
      const y = cy * cellSize;
      ctx.fillStyle = "orange";
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }
}

function drawWalls(maze: Maze) {
  const { grid, cellSize, walls } = maze;
  for (let cx = 0; cx < grid.length; cx++) {
    for (let cy = 0; cy < grid[cx].length; cy++) {
      const x = cx * cellSize;
      const y = cy * cellSize;
      const wall = walls[cx][cy];
      ctx.fillStyle = "black";
      if (wall.top) {
        ctx.fillRect(x, y, cellSize, 2);
      }
      if (wall.right) {
        ctx.fillRect(x + cellSize - 2, y, 2, cellSize);
      }
      if (wall.bottom) {
        ctx.fillRect(x, y + cellSize - 2, cellSize, 2);
      }
      if (wall.left) {
        ctx.fillRect(x, y, 2, cellSize);
      }
    }
  }
}

function generateMaze(width: number, height: number): Maze {
  const cellSize = Math.floor(Math.min(canvas.width / width, canvas.height / height));
  const grid: Array<Array<number>> = Array.from({ length: width }, () => Array(height).fill(0));
  const walls: Array<Array<Wall>> = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => {
      return {
        top: true,
        right: true,
        bottom: true,
        left: true,
      } as Wall;
    }),
  );

  const stack: Array<Array<number>> = [];
  let currentCell = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
  grid[currentCell[0]][currentCell[1]] = Status.VISITED;
  stack.push(currentCell);

  while (stack.length > 0) {
    currentCell = stack.pop()!;
    const unvisited = neighbors(grid, currentCell).filter(
      (neighbor) => (grid[neighbor[0]][neighbor[1]] & Status.VISITED) == 0,
    );
    if (unvisited.length > 0) {
      stack.push(currentCell);
      const randomNeighbor = unvisited[Math.floor(Math.random() * unvisited.length)];
      const dx = randomNeighbor[0] - currentCell[0];
      const dy = randomNeighbor[1] - currentCell[1];
      if (dx == 1) {
        // neighbor is right
        walls[currentCell[0]][currentCell[1]].right = false;
        walls[randomNeighbor[0]][randomNeighbor[1]].left = false;
      } else if (dx == -1) {
        // neighbor is left
        walls[currentCell[0]][currentCell[1]].left = false;
        walls[randomNeighbor[0]][randomNeighbor[1]].right = false;
      }
      if (dy == 1) {
        // neighbor is down
        walls[currentCell[0]][currentCell[1]].bottom = false;
        walls[randomNeighbor[0]][randomNeighbor[1]].top = false;
      } else if (dy == -1) {
        // neighbor is up
        walls[currentCell[0]][currentCell[1]].top = false;
        walls[randomNeighbor[0]][randomNeighbor[1]].bottom = false;
      }
      grid[randomNeighbor[0]][randomNeighbor[1]] |= Status.VISITED;
      stack.push(randomNeighbor);
    }
  }

  return {
    grid,
    walls,
    cellSize,
  };
}

function findSolution(maze: Maze, start: number[], end: number[]) {
  const parentAndDist: number[][][] = Array.from({ length: maze.grid.length }, () =>
    Array.from({ length: maze.grid[0].length }, () => [-1, -1, Infinity]),
  );

  const queue = [];
  queue.push(start);
  parentAndDist[start[0]][start[1]][2] = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighborCells = neighbors(maze.grid, current);
    neighborCells.forEach((neighbor) => {
      const dx = neighbor[0] - current[0];
      const dy = neighbor[1] - current[1];
      if (
        (dx == 1 && maze.walls[current[0]][current[1]].right) ||
        (dx == -1 && maze.walls[current[0]][current[1]].left) ||
        (dy == 1 && maze.walls[current[0]][current[1]].bottom) ||
        (dy == -1 && maze.walls[current[0]][current[1]].top)
      ) {
        return;
      }

      if (parentAndDist[neighbor[0]][neighbor[1]][2] === Infinity) {
        parentAndDist[neighbor[0]][neighbor[1]] = [
          current[0],
          current[1],
          parentAndDist[current[0]][current[1]][2] + 1,
        ];
        queue.push(neighbor);
      }
    });
  }

  const path = [];
  let current = end;
  path.push(current);
  while (parentAndDist[current[0]][current[1]][0] != -1) {
    const parent = parentAndDist[current[0]][current[1]];
    path.push([parent[0], parent[1]]);
    current = parent;
  }
  path.reverse();

  ctx.fillStyle = "rgb(200,200,200)";
  path.forEach((cell) => {
    ctx.fillRect(cell[0] * maze.cellSize, cell[1] * maze.cellSize, maze.cellSize, maze.cellSize);
  });
}

function generate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const widthInput = document.getElementById("width-input") as HTMLInputElement;
  const heightInput = document.getElementById("height-input") as HTMLInputElement;
  const width = widthInput.valueAsNumber;
  const height = heightInput.valueAsNumber;

  const maze = generateMaze(width, height);
  drawCells(maze);
  findSolution(maze, [0, 0], [width - 1, height - 1]);
  drawWalls(maze);
}

function resize() {
  const canvasSizeInput = document.getElementById("canvas-size-input") as HTMLInputElement;
  const size = canvasSizeInput.valueAsNumber;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = size;
  canvas.height = size;
  generate();
}

resize();
