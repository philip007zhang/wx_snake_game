const {
  LANGUAGE_OPTIONS,
  formatText,
  getLanguage,
  getPageText,
  setLanguage
} = require("../../utils/i18n");

const GRID_SIZE = 12;
const TICK_MS = 220;
const DIAMONDS_PER_LEVEL = 6;
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
const START_SNAKE = [
  { x: 4, y: 6 },
  { x: 3, y: 6 },
  { x: 2, y: 6 }
];

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

function cloneSnake() {
  return START_SNAKE.map((segment) => ({ x: segment.x, y: segment.y }));
}

function createKey(x, y) {
  return `${x}-${y}`;
}

function createReservedStartZone() {
  const reserved = new Set();

  for (let y = 4; y <= 8; y += 1) {
    for (let x = 1; x <= 6; x += 1) {
      reserved.add(createKey(x, y));
    }
  }

  return reserved;
}

Page({
  data: {
    board: createEmptyBoard(),
    score: 0,
    bestScore: 0,
    levelLabel: "Entry",
    diamondsThisLevel: 0,
    diamondsTarget: DIAMONDS_PER_LEVEL,
    barrierCount: 0,
    rulesLabel: "Wraparound",
    gameState: "idle",
    gameStateLabel: "Ready",
    actionButtonLabel: "Start",
    entryPopupVisible: false,
    entryPopupMessage: "",
    language: "en",
    languageOptions: LANGUAGE_OPTIONS,
    commonText: {},
    text: {}
  },

  onLoad() {
    this.language = getLanguage();
    this.applyLanguage();
    const bestScore = wx.getStorageSync("snake-best-score") || 0;
    this.bestScore = bestScore;
    this.resetGame();
  },

  onShow() {
    const latestLanguage = getLanguage();
    if (latestLanguage !== this.language) {
      this.language = latestLanguage;
      this.applyLanguage();
      this.refreshLanguageSensitiveData();
    }
  },

  onUnload() {
    this.stopTimer();
  },

  applyLanguage() {
    const locale = getPageText(this.language, "index");
    const app = getApp();
    app.globalData.language = this.language;
    wx.setNavigationBarTitle({
      title: locale.page.navTitle
    });
    this.setData({
      language: this.language,
      languageOptions: LANGUAGE_OPTIONS,
      commonText: locale.common,
      text: locale.page
    });
  },

  switchLanguage(event) {
    const nextLanguage = event.currentTarget.dataset.language;
    if (!nextLanguage || nextLanguage === this.language) {
      return;
    }

    this.language = setLanguage(nextLanguage);
    this.applyLanguage();
    this.refreshLanguageSensitiveData();
  },

  refreshLanguageSensitiveData() {
    const text = this.data.text;
    this.setData({
      levelLabel: this.levelIndex === 0 ? text.entry : String(this.levelIndex),
      rulesLabel: this.levelIndex === 0 ? text.wraparound : text.wallsStones,
      gameStateLabel: this.getGameStateLabel(this.data.gameState),
      actionButtonLabel: this.getActionButtonLabel(this.data.gameState),
      entryPopupMessage: text.popupEntry
    });
  },

  getGameStateLabel(gameState) {
    const text = this.data.text;
    if (gameState === "running") {
      return text.live;
    }
    if (gameState === "paused") {
      return text.paused;
    }
    if (gameState === "over") {
      return text.gameOver;
    }
    return text.ready;
  },

  getActionButtonLabel(gameState) {
    const text = this.data.text;
    if (gameState === "running") {
      return text.pause;
    }
    if (gameState === "paused") {
      return text.resume;
    }
    if (gameState === "over") {
      return text.restart;
    }
    return text.start;
  },

  resetGame() {
    this.stopTimer();
    this.totalScore = 0;
    this.setupLevel(0, {
      gameState: "idle"
    });
  },

  setupLevel(levelIndex, options = {}) {
    this.levelIndex = levelIndex;
    this.barrierUnitCount = levelIndex;
    this.snake = cloneSnake();
    this.direction = "right";
    this.nextDirection = "right";
    this.canTurn = true;
    this.barriers = this.generateBarriers(levelIndex);
    this.barrierKeys = new Set(this.barriers.map((cell) => createKey(cell.x, cell.y)));
    this.diamondsThisLevel = 0;
    this.food = this.spawnFood(this.snake, this.barrierKeys);

    const gameState = options.gameState || this.data.gameState || "idle";

    this.setData({
      board: this.renderBoard(this.snake, this.food, this.barriers),
      score: this.totalScore || 0,
      bestScore: this.bestScore || 0,
      levelLabel: levelIndex === 0 ? this.data.text.entry : String(levelIndex),
      diamondsThisLevel: 0,
      diamondsTarget: DIAMONDS_PER_LEVEL,
      barrierCount: levelIndex,
      rulesLabel: levelIndex === 0 ? this.data.text.wraparound : this.data.text.wallsStones,
      gameState,
      gameStateLabel: this.getGameStateLabel(gameState),
      actionButtonLabel: this.getActionButtonLabel(gameState),
      entryPopupVisible: levelIndex === 0,
      entryPopupMessage: this.data.text.popupEntry
    });
  },

  closeEntryPopup() {
    this.setData({
      entryPopupVisible: false
    });
  },

  handleStartPause() {
    if (this.data.gameState === "running") {
      this.stopTimer();
      this.setData({
        gameState: "paused",
        gameStateLabel: this.data.text.paused,
        actionButtonLabel: this.data.text.resume
      });
      return;
    }

    if (this.data.gameState === "over") {
      this.resetGame();
    }

    this.startTimer();
    this.setData({
      gameState: "running",
      gameStateLabel: this.data.text.live,
      actionButtonLabel: this.data.text.pause
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
    const nextHead = this.getNextHead(head, vector);
    const grew = this.food && nextHead.x === this.food.x && nextHead.y === this.food.y;
    const occupiedSegments = grew ? this.snake : this.snake.slice(0, -1);

    const hitsWall = nextHead.outOfBounds;
    const hitsSelf = occupiedSegments.some(
      (segment) => segment.x === nextHead.x && segment.y === nextHead.y
    );
    const hitsBarrier = this.barrierKeys.has(createKey(nextHead.x, nextHead.y));

    if (hitsWall || hitsSelf || hitsBarrier) {
      this.finishGame(hitsBarrier ? this.data.text.crashBarrier : this.data.text.crashGeneric);
      return;
    }

    const nextSnake = [{ x: nextHead.x, y: nextHead.y }].concat(this.snake);

    if (!grew) {
      nextSnake.pop();
    }

    this.snake = nextSnake;
    if (grew) {
      this.handleDiamondCollected(nextSnake);
      return;
    }

    this.canTurn = true;
    this.setData({
      board: this.renderBoard(this.snake, this.food, this.barriers)
    });
  },

  getNextHead(head, vector) {
    let x = head.x + vector.x;
    let y = head.y + vector.y;

    if (this.levelIndex === 0) {
      if (x < 0) {
        x = GRID_SIZE - 1;
      } else if (x >= GRID_SIZE) {
        x = 0;
      }

      if (y < 0) {
        y = GRID_SIZE - 1;
      } else if (y >= GRID_SIZE) {
        y = 0;
      }

      return {
        x,
        y,
        outOfBounds: false
      };
    }

    return {
      x,
      y,
      outOfBounds: x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE
    };
  },

  handleDiamondCollected(nextSnake) {
    this.totalScore += 1;
    this.diamondsThisLevel += 1;

    const bestScore = Math.max(this.bestScore || 0, this.totalScore);
    this.bestScore = bestScore;
    wx.setStorageSync("snake-best-score", bestScore);

    if (this.diamondsThisLevel >= DIAMONDS_PER_LEVEL) {
      this.advanceToNextLevel();
      return;
    }

    this.food = this.spawnFood(nextSnake, this.barrierKeys);
    this.canTurn = true;
    this.setData({
      score: this.totalScore,
      bestScore,
      diamondsThisLevel: this.diamondsThisLevel,
      board: this.renderBoard(this.snake, this.food, this.barriers)
    });
  },

  advanceToNextLevel() {
    const nextLevel = this.levelIndex + 1;
    const text = this.data.text;

    wx.showToast({
      title:
        this.levelIndex === 0
          ? text.entryCleared
          : formatText(text.levelCleared, { level: this.levelIndex }),
      icon: "success"
    });

    this.setupLevel(nextLevel, {
      gameState: "running"
    });
  },

  finishGame() {
    const bestScore = Math.max(this.bestScore || 0, this.totalScore || 0);
    this.stopTimer();
    this.bestScore = bestScore;
    wx.setStorageSync("snake-best-score", bestScore);
    this.setData({
      bestScore,
      gameState: "over",
      gameStateLabel: this.data.text.gameOver,
      actionButtonLabel: this.data.text.restart
    });
  },

  generateBarriers(levelIndex) {
    if (levelIndex <= 0) {
      return [];
    }

    const barriers = [];
    const occupied = createReservedStartZone();

    for (let index = 0; index < levelIndex; index += 1) {
      let placed = false;

      for (let attempt = 0; attempt < 200 && !placed; attempt += 1) {
        const horizontal = Math.random() < 0.5;
        const length = 2 + randomInt(2);
        const startX = horizontal ? randomInt(GRID_SIZE - length + 1) : randomInt(GRID_SIZE);
        const startY = horizontal ? randomInt(GRID_SIZE) : randomInt(GRID_SIZE - length + 1);
        const cells = [];

        for (let offset = 0; offset < length; offset += 1) {
          const x = horizontal ? startX + offset : startX;
          const y = horizontal ? startY : startY + offset;
          cells.push({ x, y });
        }

        const blocked = cells.some((cell) => occupied.has(createKey(cell.x, cell.y)));
        if (blocked) {
          continue;
        }

        cells.forEach((cell) => {
          occupied.add(createKey(cell.x, cell.y));
          barriers.push(cell);
        });
        placed = true;
      }
    }

    return barriers;
  },

  spawnFood(snake, barrierKeys) {
    const occupied = new Set(snake.map((segment) => createKey(segment.x, segment.y)));
    barrierKeys.forEach((key) => occupied.add(key));
    const candidates = [];

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const key = createKey(x, y);
        if (!occupied.has(key)) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    return candidates[randomInt(candidates.length)];
  },

  renderBoard(snake, food, barriers) {
    const board = createEmptyBoard();

    barriers.forEach((barrier) => {
      board[barrier.y].cells[barrier.x].type = "barrier";
    });

    snake.forEach((segment, index) => {
      board[segment.y].cells[segment.x].type = index === 0 ? "head" : "body";
    });

    if (food) {
      board[food.y].cells[food.x].type = "food";
    }

    return board;
  }
});
