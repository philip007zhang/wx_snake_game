const GRID_SIZE = 20;
const MOVE_INTERVAL = 220;

Page({
  data: {
    cells: [],
    score: 0,
    statusText: 'Tap Start to play'
  },

  onLoad() {
    this.timer = null;
    this.initState();
  },

  onUnload() {
    this.stopTimer();
  },

  initState() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.direction = 'right';
    this.pendingDirection = 'right';
    this.food = this.createFood();
    this.isRunning = false;
    this.setData({ score: 0, statusText: 'Tap Start to play' });
    this.renderBoard();
  },

  startGame() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.setData({ statusText: 'Running' });
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), MOVE_INTERVAL);
  },

  pauseGame() {
    this.isRunning = false;
    this.stopTimer();
    this.setData({ statusText: 'Paused' });
  },

  restartGame() {
    this.stopTimer();
    this.initState();
    this.startGame();
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  changeDirection(e) {
    const next = e.currentTarget.dataset.direction;
    const opposites = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    if (!next || opposites[next] === this.direction) {
      return;
    }
    this.pendingDirection = next;
  },

  tick() {
    if (!this.isRunning) {
      return;
    }

    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const nextHead = { ...head };

    if (this.direction === 'up') nextHead.y -= 1;
    if (this.direction === 'down') nextHead.y += 1;
    if (this.direction === 'left') nextHead.x -= 1;
    if (this.direction === 'right') nextHead.x += 1;

    if (nextHead.x < 0) nextHead.x = GRID_SIZE - 1;
    if (nextHead.y < 0) nextHead.y = GRID_SIZE - 1;
    if (nextHead.x >= GRID_SIZE) nextHead.x = 0;
    if (nextHead.y >= GRID_SIZE) nextHead.y = 0;

    const hitSelf = this.snake.some((part) => part.x === nextHead.x && part.y === nextHead.y);
    if (hitSelf) {
      this.pauseGame();
      this.setData({ statusText: 'Game over! Tap Restart' });
      wx.showToast({ title: 'Game Over', icon: 'none' });
      return;
    }

    this.snake.unshift(nextHead);

    if (nextHead.x === this.food.x && nextHead.y === this.food.y) {
      this.food = this.createFood();
      this.setData({ score: this.data.score + 1 });
    } else {
      this.snake.pop();
    }

    this.renderBoard();
  },

  createFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (this.snake.some((part) => part.x === food.x && part.y === food.y));
    return food;
  },

  renderBoard() {
    const snakeMap = new Map();
    this.snake.forEach((part, index) => {
      const key = `${part.x}-${part.y}`;
      snakeMap.set(key, index === 0 ? 'head' : 'snake');
    });

    const cells = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const key = `${x}-${y}`;
        let type = 'empty';
        if (this.food.x === x && this.food.y === y) {
          type = 'food';
        }
        if (snakeMap.has(key)) {
          type = snakeMap.get(key);
        }
        cells.push({ type });
      }
    }

    this.setData({ cells });
  }
});
