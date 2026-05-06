const GRID_SIZE = 12;
const TICK_MS = 220;
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, (_, rowIndex) => ({
    id: `row-${rowIndex}`,
    cells: Array.from({ length: GRID_SIZE }, (_, colIndex) => ({
      id: `${colIndex}-${rowIndex}`,
      type: "empty"
    }))
  }));
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

Page({
  data: {
    board: createEmptyBoard(),
    score: 0,
    bestScore: 0,
    gameState: "idle",
    gameStateLabel: "Ready",
    statusText: "Tap Start, then steer with the buttons below.",
    actionButtonLabel: "Start"
  },

  onLoad() {
    const bestScore = wx.getStorageSync("snake-best-score") || 0;
    this.bestScore = bestScore;
    this.resetGame();
  },

  onUnload() {
    this.stopTimer();
  },

  resetGame() {
    this.stopTimer();

    this.snake = [
      { x: 4, y: 6 },
      { x: 3, y: 6 },
      { x: 2, y: 6 }
    ];
    this.direction = "right";
    this.nextDirection = "right";
    this.canTurn = true;
    this.food = this.spawnFood(this.snake);

    this.setData({
      board: this.renderBoard(this.snake, this.food),
      score: 0,
      bestScore: this.bestScore || 0,
      gameState: "idle",
      gameStateLabel: "Ready",
      statusText: "Tap Start, then steer with the buttons below.",
      actionButtonLabel: "Start"
    });
  },

  handleStartPause() {
    if (this.data.gameState === "running") {
      this.stopTimer();
      this.setData({
        gameState: "paused",
        gameStateLabel: "Paused",
        statusText: "Paused. Tap Start to keep going.",
        actionButtonLabel: "Resume"
      });
      return;
    }

    if (this.data.gameState === "over") {
      this.resetGame();
    }

    this.startTimer();
    this.setData({
      gameState: "running",
      gameStateLabel: "Live",
      statusText: "Catch the glowing tile and avoid the walls.",
      actionButtonLabel: "Pause"
    });
  },

  goSupport() {
    wx.navigateTo({
      url: `/pages/support/support?score=${this.data.score}`
    });
  },

  turn(event) {
    const nextDirection = event.currentTarget.dataset.direction;
    if (!DIRECTIONS[nextDirection]) {
      return;
    }

    if (this.data.gameState !== "running") {
      this.direction = nextDirection;
      this.nextDirection = nextDirection;
      this.canTurn = true;
      return;
    }

    if (!this.canTurn) {
      return;
    }

    const currentVector = DIRECTIONS[this.direction];
    const nextVector = DIRECTIONS[nextDirection];
    const reversing =
      currentVector.x + nextVector.x === 0 &&
      currentVector.y + nextVector.y === 0;

    if (reversing) {
      return;
    }

    this.nextDirection = nextDirection;
    this.canTurn = false;
  },

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  tick() {
    this.direction = this.nextDirection;
    const head = this.snake[0];
    const vector = DIRECTIONS[this.direction];
    const nextHead = {
      x: head.x + vector.x,
      y: head.y + vector.y
    };
    const grew = nextHead.x === this.food.x && nextHead.y === this.food.y;
    const occupiedSegments = grew ? this.snake : this.snake.slice(0, -1);

    const hitsWall =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= GRID_SIZE ||
      nextHead.y >= GRID_SIZE;
    const hitsSelf = occupiedSegments.some(
      (segment) => segment.x === nextHead.x && segment.y === nextHead.y
    );

    if (hitsWall || hitsSelf) {
      this.finishGame();
      return;
    }

    const nextSnake = [nextHead].concat(this.snake);

    if (!grew) {
      nextSnake.pop();
    }

    this.snake = nextSnake;
    if (grew) {
      this.food = this.spawnFood(nextSnake);
      const nextScore = this.data.score + 1;
      const bestScore = Math.max(this.bestScore || 0, nextScore);
      this.bestScore = bestScore;
      wx.setStorageSync("snake-best-score", bestScore);
      this.setData({
        score: nextScore,
        bestScore,
        statusText: "Nice run. Keep the streak alive."
      });
    }

    this.canTurn = true;
    this.setData({
      board: this.renderBoard(this.snake, this.food)
    });
  },

  finishGame() {
    this.stopTimer();
    const bestScore = Math.max(this.bestScore || 0, this.data.score);
    this.bestScore = bestScore;
    wx.setStorageSync("snake-best-score", bestScore);
    this.setData({
      bestScore,
      gameState: "over",
      gameStateLabel: "Game Over",
      statusText: "You crashed. Reset or donate to support the game.",
      actionButtonLabel: "Restart"
    });
  },

  spawnFood(snake) {
    const occupied = new Set(snake.map((segment) => `${segment.x}-${segment.y}`));
    const candidates = [];

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const key = `${x}-${y}`;
        if (!occupied.has(key)) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length === 0) {
      return { x: randomInt(GRID_SIZE), y: randomInt(GRID_SIZE) };
    }

    return candidates[randomInt(candidates.length)];
  },

  renderBoard(snake, food) {
    const board = createEmptyBoard();

    snake.forEach((segment, index) => {
      board[segment.y].cells[segment.x].type = index === 0 ? "head" : "body";
    });

    if (food) {
      board[food.y].cells[food.x].type = "food";
    }

    return board;
  }
});
