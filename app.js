const questionBank = [
  // th
  { target: "th", prompt: "thin", choices: ["thin", "sin", "fin"], answer: "thin" },
  { target: "th", prompt: "three", choices: ["three", "free", "tree"], answer: "three" },
  { target: "th", prompt: "think", choices: ["think", "sink", "pink"], answer: "think" },
  { target: "th", prompt: "thumb", choices: ["thumb", "sum", "hum"], answer: "thumb" },
  { target: "th", prompt: "bath", choices: ["bath", "back", "batch"], answer: "bath" },

  // sh
  { target: "sh", prompt: "ship", choices: ["ship", "sip", "chip"], answer: "ship" },
  { target: "sh", prompt: "shop", choices: ["shop", "chop", "stop"], answer: "shop" },
  { target: "sh", prompt: "she", choices: ["she", "see", "key"], answer: "she" },
  { target: "sh", prompt: "fish", choices: ["fish", "fist", "fit"], answer: "fish" },
  { target: "sh", prompt: "shoe", choices: ["shoe", "show", "so"], answer: "shoe" },

  // ch
  { target: "ch", prompt: "chip", choices: ["chip", "ship", "sip"], answer: "chip" },
  { target: "ch", prompt: "chin", choices: ["chin", "shin", "sin"], answer: "chin" },
  { target: "ch", prompt: "chat", choices: ["chat", "that", "cat"], answer: "chat" },
  { target: "ch", prompt: "check", choices: ["check", "neck", "deck"], answer: "check" },
  { target: "ch", prompt: "much", choices: ["much", "mush", "rush"], answer: "much" },

  // ai
  { target: "ai", prompt: "rain", choices: ["rain", "ran", "ring"], answer: "rain" },
  { target: "ai", prompt: "mail", choices: ["mail", "mill", "meal"], answer: "mail" },
  { target: "ai", prompt: "tail", choices: ["tail", "tell", "tall"], answer: "tail" },
  { target: "ai", prompt: "wait", choices: ["wait", "wet", "want"], answer: "wait" },
  { target: "ai", prompt: "pain", choices: ["pain", "pan", "pen"], answer: "pain" },

  // ee
  { target: "ee", prompt: "see", choices: ["see", "she", "sea"], answer: "see" },
  { target: "ee", prompt: "feet", choices: ["feet", "fit", "fat"], answer: "feet" },
  { target: "ee", prompt: "green", choices: ["green", "grin", "grain"], answer: "green" },
  { target: "ee", prompt: "sleep", choices: ["sleep", "slip", "step"], answer: "sleep" },
  { target: "ee", prompt: "tree", choices: ["tree", "try", "three"], answer: "tree" },

  // oa
  { target: "oa", prompt: "boat", choices: ["boat", "boot", "beat"], answer: "boat" },
  { target: "oa", prompt: "coat", choices: ["coat", "cot", "cut"], answer: "coat" },
  { target: "oa", prompt: "road", choices: ["road", "read", "rid"], answer: "road" },
  { target: "oa", prompt: "goat", choices: ["goat", "got", "gate"], answer: "goat" },
  { target: "oa", prompt: "soap", choices: ["soap", "soup", "sip"], answer: "soap" }
];

const STORAGE_KEYS = {
  wrongQueue: "phonics_wrong_queue",
  stars: "phonics_star_count"
};

const state = {
  currentIndex: 0,
  score: 0,
  totalQuestions: 10,
  currentQuestion: null,
  questionSet: [],
  hearts: 3,
  isSpeaking: false,
  reviewNoticeTimeout: null,
  pacman: { x: 0, y: 0, speed: 3, vx: 0, vy: 0 },
  isActive: true,
  moveInterval: null,
  isResolving: false
};

const elements = {
  playSound: document.getElementById("playSound"),
  questionProgress: document.getElementById("questionProgress"),
  scoreResult: document.getElementById("scoreResult"),
  resultCard: document.getElementById("resultCard"),
  gameCard: document.getElementById("gameCard"),
  restartGame: document.getElementById("restartGame"),
  starCount: document.getElementById("starCount"),
  levelProgress: document.getElementById("levelProgress"),
  gemCount: document.getElementById("gemCount"),
  heartCount: document.getElementById("heartCount"),
  openSticker: document.getElementById("openSticker"),
  closeSticker: document.getElementById("closeSticker"),
  stickerPage: document.getElementById("stickerPage"),
  stickerGrid: document.getElementById("stickerGrid"),
  reviewNotice: document.getElementById("reviewNotice"),
  resultTitle: document.getElementById("resultTitle"),
  resultMessage: document.getElementById("resultMessage"),
  maze: document.getElementById("maze"),
  pacman: document.getElementById("pacman"),
  pelletLeft: document.getElementById("pelletLeft"),
  pelletDown: document.getElementById("pelletDown"),
  pelletRight: document.getElementById("pelletRight")
};

const stickerList = [
  { label: "小兔子", emoji: "🐰" },
  { label: "小恐龙", emoji: "🦕" },
  { label: "彩虹", emoji: "🌈" },
  { label: "宇宙", emoji: "🚀" }
];

const STAR_STEP = 3;

const getStoredArray = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const setStoredArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getStars = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.stars);
  const count = Number(raw);
  return Number.isFinite(count) ? count : 0;
};

const setStars = (value) => {
  localStorage.setItem(STORAGE_KEYS.stars, String(value));
};

const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const setSpeakingStatus = (isSpeaking) => {
  state.isSpeaking = isSpeaking;
  if (state.scene) {
    state.scene.updateListenButton(isSpeaking);
  }
};

const buildQuestionSet = () => {
  const wrongQueue = getStoredArray(STORAGE_KEYS.wrongQueue);
  const wrongPool = questionBank.filter((item) => wrongQueue.includes(item.prompt));
  const available = questionBank.filter((item) => !wrongQueue.includes(item.prompt));

  const prioritized = shuffle(wrongPool).concat(shuffle(available));
  return prioritized.slice(0, state.totalQuestions);
};

const speakPrompt = (prompt) => {
  const speechSynthesisApi = window.speechSynthesis;
  const Utterance = window.SpeechSynthesisUtterance;
  if (!speechSynthesisApi || !Utterance) {
    alert("当前浏览器不支持语音播放，请手动朗读单词。");
    setSpeakingStatus(false);
    return;
  }
  setSpeakingStatus(true);
  const firstUtterance = new Utterance(prompt);
  firstUtterance.lang = "en-US";
  firstUtterance.rate = 1.0;

  const slowUtterance = new Utterance(prompt);
  slowUtterance.lang = "en-US";
  slowUtterance.rate = 0.05;

  let finished = false;
  const finishSpeaking = () => {
    if (finished) return;
    finished = true;
    setSpeakingStatus(false);
  };

  firstUtterance.onend = () => {
    setTimeout(() => {
      speechSynthesisApi.speak(slowUtterance);
    }, 350);
  };
  firstUtterance.onerror = finishSpeaking;

  slowUtterance.onend = finishSpeaking;
  slowUtterance.onerror = finishSpeaking;

  speechSynthesisApi.cancel();
  speechSynthesisApi.speak(firstUtterance);
};

const updateWrongQueue = (prompt, isCorrect) => {
  const wrongQueue = new Set(getStoredArray(STORAGE_KEYS.wrongQueue));
  if (!isCorrect) {
    wrongQueue.add(prompt);
  } else {
    wrongQueue.delete(prompt);
  }
  setStoredArray(STORAGE_KEYS.wrongQueue, Array.from(wrongQueue));
};

const updateStats = () => {
  elements.gemCount.textContent = state.score;
  elements.heartCount.textContent = state.hearts;
  elements.starCount.textContent = getStars();
  elements.levelProgress.textContent = `${state.currentIndex + 1} / ${state.totalQuestions}`;
  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.totalQuestions} 关`;
};

class MazeScene extends Phaser.Scene {
  constructor() {
    super("MazeScene");
    this.pacman = null;
    this.pellets = [];
    this.pelletLabels = [];
    this.hud = {};
    this.listenButton = null;
    this.listenLabel = null;
    this.resultLayer = null;
    this.cursors = null;
    this.wasd = null;
  }

  setPacmanPosition(x, y) {
    const mazeRect = elements.maze.getBoundingClientRect();
    const size = elements.pacman.offsetWidth;
    const maxX = mazeRect.width - size;
    const maxY = mazeRect.height - size;
    state.pacman.x = Math.min(Math.max(0, x), maxX);
    state.pacman.y = Math.min(Math.max(0, y), maxY);
    elements.pacman.style.transform = `translate(${state.pacman.x}px, ${state.pacman.y}px)`;
  }

  resetPacman() {
    const mazeRect = elements.maze.getBoundingClientRect();
    const size = elements.pacman.offsetWidth;
    this.setPacmanPosition(mazeRect.width / 2 - size / 2, mazeRect.height / 2 - size / 2);
    state.pacman.vx = 0;
    state.pacman.vy = 0;
  }

  positionPellets(choices) {
    const [left, down, right] = choices;
    elements.pelletLeft.textContent = left;
    elements.pelletDown.textContent = down;
    elements.pelletRight.textContent = right;

    elements.pelletLeft.className = "pellet pellet--left";
    elements.pelletDown.className = "pellet pellet--down";
    elements.pelletRight.className = "pellet pellet--right";
  }

  renderQuestion() {
    if (!this.pacman || state.isTransitioning || this.resultLayer.visible) {
      return;
    }

    const options = shuffle(state.currentQuestion.choices);
    this.positionPellets(options);
    updateStats();
    this.resetPacman();
    speakPrompt(state.currentQuestion.prompt);
  }

  handleCorrect() {
    state.score += 1;
    const stars = getStars() + 1;
    setStars(stars);
    updateWrongQueue(state.currentQuestion.prompt, true);
    updateStats();

    if (state.currentIndex >= state.totalQuestions - 1) {
      this.showResults();
      return;
    }

    state.currentIndex += 1;
    this.renderQuestion();
    state.isResolving = false;
  }

  handleWrong() {
    state.hearts = Math.max(0, state.hearts - 1);
    updateWrongQueue(state.currentQuestion.prompt, false);
    showReviewNotice();
    updateStats();
    this.positionPellets(shuffle(state.currentQuestion.choices));
    this.resetPacman();
    state.isResolving = false;
  }

  showResults() {
    state.isActive = false;
    this.stopMovement();
    elements.scoreResult.textContent = state.score;
    elements.gameCard.classList.add("hidden");
    elements.resultCard.classList.remove("hidden");

    if (state.score >= 7) {
      elements.resultTitle.textContent = "出口开启通关 🎉";
      elements.resultMessage.textContent = "你已收集足够宝石，成功通过迷宫！";
    } else {
      elements.resultTitle.textContent = "未达到 7 个宝石";
      elements.resultMessage.textContent = "未达到 7 个宝石，再来一次吧！";
    }
  }

  movePacman() {
    if (!state.isActive) return;
    const { vx, vy, speed } = state.pacman;
    if (vx === 0 && vy === 0) return;
    this.setPacmanPosition(state.pacman.x + vx * speed, state.pacman.y + vy * speed);
    this.checkCollision();
  }

  startMovement() {
    if (state.moveInterval) {
      clearInterval(state.moveInterval);
    }
    state.moveInterval = setInterval(() => this.movePacman(), 16);
  }

  stopMovement() {
    if (state.moveInterval) {
      clearInterval(state.moveInterval);
      state.moveInterval = null;
    }
  }

  checkCollision() {
    if (state.isResolving) return;
    const pacmanRect = elements.pacman.getBoundingClientRect();
    const pellets = [elements.pelletLeft, elements.pelletDown, elements.pelletRight];
    pellets.forEach((pellet) => {
      if (pellet.classList.contains("eaten")) return;
      const pelletRect = pellet.getBoundingClientRect();
      const hit =
        pacmanRect.left < pelletRect.right &&
        pacmanRect.right > pelletRect.left &&
        pacmanRect.top < pelletRect.bottom &&
        pacmanRect.bottom > pelletRect.top;
      if (hit) {
        state.isResolving = true;
        pellet.classList.add("eaten");
        const choiceText = pellet.textContent;
        if (choiceText === state.currentQuestion.answer) {
          this.handleCorrect();
        } else {
          this.handleWrong();
        }
      }
    });
  }

  handleKeyDown(event) {
    if (!state.isActive) return;
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
    }

    switch (key) {
      case "arrowup":
      case "w":
        state.pacman.vx = 0;
        state.pacman.vy = -1;
        break;
      case "arrowdown":
      case "s":
        state.pacman.vx = 0;
        state.pacman.vy = 1;
        break;
      case "arrowleft":
      case "a":
        state.pacman.vx = -1;
        state.pacman.vy = 0;
        break;
      case "arrowright":
      case "d":
        state.pacman.vx = 1;
        state.pacman.vy = 0;
        break;
      default:
        break;
    }
  }

  handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (["arrowup", "w", "arrowdown", "s"].includes(key)) {
      state.pacman.vy = 0;
    }
    if (["arrowleft", "a", "arrowright", "d"].includes(key)) {
      state.pacman.vx = 0;
    }
  }

  startGame() {
    state.currentIndex = 0;
    state.score = 0;
    state.hearts = 3;
    state.questionSet = buildQuestionSet();
    state.isActive = true;
    state.isResolving = false;
    elements.gameCard.classList.remove("hidden");
    elements.resultCard.classList.add("hidden");
    setSpeakingStatus(false);
    this.renderQuestion();
    this.startMovement();
  }

  renderStickers() {
    const stars = getStars();
    elements.stickerGrid.innerHTML = "";
    stickerList.forEach((sticker, index) => {
      const threshold = (index + 1) * STAR_STEP;
      const unlocked = stars >= threshold;
      const item = document.createElement("div");
      item.className = `sticker__item ${unlocked ? "" : "locked"}`.trim();
      item.innerHTML = unlocked
        ? `<div class="sticker__emoji">${sticker.emoji}</div><div>${sticker.label}</div>`
        : `<div>🔒</div><div>还差 ${threshold - stars} 星</div>`;
      elements.stickerGrid.appendChild(item);
    });
  }

  toggleSticker(show) {
    elements.stickerPage.setAttribute("aria-hidden", show ? "false" : "true");
    if (show) {
      this.renderStickers();
    }
  }

  init() {
    updateStats();
    this.startGame();
  }
}

const scene = new MazeScene();

elements.playSound.addEventListener("click", () => {
  if (state.currentQuestion) {
    speakPrompt(state.currentQuestion.prompt);
  }
});

elements.restartGame.addEventListener("click", () => scene.startGame());

elements.openSticker.addEventListener("click", () => scene.toggleSticker(true));

elements.closeSticker.addEventListener("click", () => scene.toggleSticker(false));

elements.stickerPage.addEventListener("click", (event) => {
  if (event.target === elements.stickerPage) {
    scene.toggleSticker(false);
  }
});

window.addEventListener("keydown", (event) => scene.handleKeyDown(event));
window.addEventListener("keyup", (event) => scene.handleKeyUp(event));
window.addEventListener("resize", () => scene.resetPacman());

scene.init();
