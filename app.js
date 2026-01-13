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
  scene: null,
  isTransitioning: false
};

const elements = {
  openSticker: document.getElementById("openSticker"),
  closeSticker: document.getElementById("closeSticker"),
  stickerPage: document.getElementById("stickerPage"),
  stickerGrid: document.getElementById("stickerGrid")
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

  preload() {
    this.load.setPath("assets");
  }

  create() {
    state.scene = this;
    this.createTextures();
    this.drawMaze();
    this.createHud();
    this.createListenButton();
    this.createPlayer();
    this.createPellets();
    this.createResultLayer();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");

    this.startGame();
  }

  update() {
    if (!this.pacman || state.isTransitioning || this.resultLayer.visible) {
      return;
    }

    const speed = 180;
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -speed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = speed;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = speed;
    }

    this.pacman.setVelocity(velocityX, velocityY);
  }

  createTextures() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture("pacman", 32, 32);
    graphics.clear();

    graphics.fillStyle(0xfff1b0, 1);
    graphics.fillCircle(18, 18, 18);
    graphics.generateTexture("pellet", 36, 36);
    graphics.destroy();
  }

  drawMaze() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#fff8fd");

    const graphics = this.add.graphics();
    graphics.lineStyle(10, 0xffdbe6, 1);

    const centerX = width / 2;
    const centerY = height * 0.55;
    const topY = height * 0.18;
    const leftX = width * 0.25;
    const rightX = width * 0.75;
    const bottomY = height * 0.88;

    graphics.beginPath();
    graphics.moveTo(centerX, bottomY);
    graphics.lineTo(centerX, centerY);
    graphics.lineTo(leftX, centerY);
    graphics.moveTo(centerX, centerY);
    graphics.lineTo(rightX, centerY);
    graphics.moveTo(centerX, centerY);
    graphics.lineTo(centerX, topY);
    graphics.strokePath();

    graphics.fillStyle(0xeaf7ef, 1);
    graphics.fillRoundedRect(centerX - 60, topY - 42, 120, 34, 16);
    this.add
      .text(centerX, topY - 25, "出口", {
        fontSize: "16px",
        fontStyle: "700",
        color: "#3b9d5f"
      })
      .setOrigin(0.5);
  }

  createHud() {
    const { width } = this.scale;
    this.hud.level = this.add.text(20, 16, "关卡 1/10", {
      fontSize: "18px",
      fontStyle: "700",
      color: "#3b3b3b"
    });
    this.hud.gems = this.add.text(width * 0.3, 16, "💎 0", {
      fontSize: "18px",
      fontStyle: "700",
      color: "#3b3b3b"
    });
    this.hud.hearts = this.add.text(width * 0.5, 16, "❤️ 3", {
      fontSize: "18px",
      fontStyle: "700",
      color: "#3b3b3b"
    });
    this.hud.stars = this.add.text(width * 0.7, 16, "⭐ 0", {
      fontSize: "18px",
      fontStyle: "700",
      color: "#3b3b3b"
    });
    this.hud.level.setDepth(5);
    this.hud.gems.setDepth(5);
    this.hud.hearts.setDepth(5);
    this.hud.stars.setDepth(5);
  }

  createListenButton() {
    const { width } = this.scale;
    const buttonWidth = 180;
    const buttonHeight = 44;
    const x = width - buttonWidth / 2 - 20;
    const y = 56;

    const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0xff8aa1, 1);
    button.setStrokeStyle(2, 0xffd1dc);
    button.setInteractive({ useHandCursor: true });

    const label = this.add.text(x, y, "🔊 再听一次", {
      fontSize: "16px",
      fontStyle: "700",
      color: "#ffffff"
    });
    label.setOrigin(0.5);

    button.on("pointerdown", () => {
      if (!state.currentQuestion || state.isSpeaking) return;
      speakPrompt(state.currentQuestion.prompt);
    });

    this.listenButton = button;
    this.listenLabel = label;
    button.setDepth(5);
    label.setDepth(5);
  }

  updateListenButton(isSpeaking) {
    if (!this.listenButton || !this.listenLabel) return;
    if (isSpeaking) {
      this.listenButton.setFillStyle(0xf5c2cc, 1);
      this.listenLabel.setText("正在朗读…");
    } else {
      this.listenButton.setFillStyle(0xff8aa1, 1);
      this.listenLabel.setText("🔊 再听一次");
    }
  }

  createPlayer() {
    const { width, height } = this.scale;
    this.pacman = this.physics.add.image(width / 2, height * 0.82, "pacman");
    this.pacman.setCollideWorldBounds(true);
    this.pacman.setCircle(16);
    this.pacman.setDepth(3);
  }

  createPellets() {
    const { width, height } = this.scale;
    const positions = [
      { x: width * 0.25, y: height * 0.55 },
      { x: width * 0.5, y: height * 0.32 },
      { x: width * 0.75, y: height * 0.55 }
    ];

    positions.forEach((pos) => {
      const pellet = this.physics.add.image(pos.x, pos.y, "pellet");
      pellet.setCircle(18);
      pellet.setImmovable(true);
      pellet.setDepth(2);
      const label = this.add.text(pos.x, pos.y, "", {
        fontSize: "16px",
        fontStyle: "700",
        color: "#8a5a00"
      });
      label.setOrigin(0.5);
      label.setDepth(3);

      this.pellets.push(pellet);
      this.pelletLabels.push(label);
    });

    this.physics.add.overlap(this.pacman, this.pellets, this.handlePelletHit, null, this);
  }

  createResultLayer() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
    const panel = this.add.rectangle(width / 2, height / 2, width * 0.7, height * 0.4, 0xffffff, 1);
    panel.setStrokeStyle(4, 0xffe0ea);

    const title = this.add.text(width / 2, height / 2 - 60, "", {
      fontSize: "24px",
      fontStyle: "700",
      color: "#3b3b3b",
      align: "center"
    });
    title.setOrigin(0.5);

    const message = this.add.text(width / 2, height / 2 - 10, "", {
      fontSize: "18px",
      color: "#f46b85",
      align: "center",
      wordWrap: { width: width * 0.6 }
    });
    message.setOrigin(0.5);

    const restartButton = this.add.rectangle(width / 2, height / 2 + 70, 180, 48, 0xff8aa1, 1);
    restartButton.setStrokeStyle(2, 0xffd1dc);
    restartButton.setInteractive({ useHandCursor: true });

    const restartLabel = this.add.text(width / 2, height / 2 + 70, "再来一局", {
      fontSize: "18px",
      fontStyle: "700",
      color: "#ffffff"
    });
    restartLabel.setOrigin(0.5);

    restartButton.on("pointerdown", () => {
      this.startGame();
    });

    const container = this.add.container(0, 0, [
      overlay,
      panel,
      title,
      message,
      restartButton,
      restartLabel
    ]);
    container.setDepth(10);
    container.setVisible(false);

    this.resultLayer = {
      container,
      title,
      message
    };
  }

  updateHud() {
    this.hud.level.setText(`关卡 ${state.currentIndex + 1}/${state.totalQuestions}`);
    this.hud.gems.setText(`💎 ${state.score}`);
    this.hud.hearts.setText(`❤️ ${state.hearts}`);
    this.hud.stars.setText(`⭐ ${getStars()}`);
  }

  startGame() {
    state.currentIndex = 0;
    state.score = 0;
    state.hearts = 3;
    state.questionSet = buildQuestionSet();
    state.isTransitioning = false;

    this.resultLayer.container.setVisible(false);
    this.updateHud();
    this.startLevel();
  }

  startLevel() {
    state.currentQuestion = state.questionSet[state.currentIndex];
    if (!state.currentQuestion) return;

    const choices = shuffle(state.currentQuestion.choices);
    this.pellets.forEach((pellet, index) => {
      const label = this.pelletLabels[index];
      pellet.setData("choice", choices[index]);
      pellet.setVisible(true);
      label.setText(choices[index]);
      label.setVisible(true);
    });

    this.resetPlayer();
    this.updateHud();
    speakPrompt(state.currentQuestion.prompt);
  }

  resetPlayer() {
    const { width, height } = this.scale;
    this.pacman.setPosition(width / 2, height * 0.82);
    this.pacman.setVelocity(0, 0);
  }

  handlePelletHit(pacman, pellet) {
    if (state.isTransitioning) return;
    state.isTransitioning = true;

    pellet.setVisible(false);
    const pelletIndex = this.pellets.indexOf(pellet);
    if (pelletIndex >= 0) {
      this.pelletLabels[pelletIndex].setVisible(false);
    }

    const choice = pellet.getData("choice");
    const isCorrect = choice === state.currentQuestion.answer;

    if (isCorrect) {
      state.score += 1;
      const stars = getStars() + 1;
      setStars(stars);
      updateWrongQueue(state.currentQuestion.prompt, true);
      this.cameras.main.flash(200, 180, 255, 180);
      this.tweens.add({
        targets: pacman,
        scale: 1.2,
        duration: 120,
        yoyo: true
      });

      this.time.delayedCall(300, () => {
        if (state.currentIndex >= state.totalQuestions - 1) {
          this.showResult();
          return;
        }
        state.currentIndex += 1;
        state.isTransitioning = false;
        this.startLevel();
      });
    } else {
      state.hearts = Math.max(0, state.hearts - 1);
      updateWrongQueue(state.currentQuestion.prompt, false);
      this.cameras.main.shake(180, 0.01);
      this.cameras.main.flash(180, 255, 120, 120);

      this.time.delayedCall(320, () => {
        state.isTransitioning = false;
        this.startLevel();
      });
    }
  }

  showResult() {
    this.updateHud();
    const win = state.score >= 7;
    this.resultLayer.title.setText(win ? "出口开启通关" : "差一点点，再来一次");
    this.resultLayer.message.setText(
      win ? "你收集到足够宝石，成功打开迷宫出口！" : "还差一些宝石，重新挑战吧！"
    );
    this.resultLayer.container.setVisible(true);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "gameContainer",
  width: 960,
  height: 540,
  backgroundColor: "#fff8fd",
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MazeScene]
};

const renderStickers = () => {
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
};

const toggleSticker = (show) => {
  elements.stickerPage.setAttribute("aria-hidden", show ? "false" : "true");
  if (show) {
    renderStickers();
  }
};

elements.openSticker.addEventListener("click", () => toggleSticker(true));

elements.closeSticker.addEventListener("click", () => toggleSticker(false));

elements.stickerPage.addEventListener("click", (event) => {
  if (event.target === elements.stickerPage) {
    toggleSticker(false);
  }
});

new Phaser.Game(config);
