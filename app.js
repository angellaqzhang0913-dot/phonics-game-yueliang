const phonicsPool = [
  { combo: "sh", audio: "audio/sh.mp3" },
  { combo: "ch", audio: "audio/ch.mp3" },
  { combo: "th", audio: "audio/th.mp3" },
  { combo: "ai", audio: "audio/ai.mp3" },
  { combo: "ee", audio: "audio/ee.mp3" },
  { combo: "oa", audio: "audio/oa.mp3" },
  { combo: "oo", audio: "audio/oo.mp3" },
  { combo: "ou", audio: "audio/ou.mp3" },
  { combo: "ar", audio: "audio/ar.mp3" },
  { combo: "er", audio: "audio/er.mp3" },
  { combo: "ir", audio: "audio/ir.mp3" },
  { combo: "or", audio: "audio/or.mp3" },
  { combo: "ph", audio: "audio/ph.mp3" },
  { combo: "wh", audio: "audio/wh.mp3" },
  { combo: "ck", audio: "audio/ck.mp3" }
];

const STORAGE_KEYS = {
  wrongQueue: "phonics_wrong_queue",
  stars: "phonics_star_count"
};

const state = {
  currentIndex: 0,
  score: 0,
  streak: 0,
  totalQuestions: 10,
  currentQuestion: null,
  wrongThisRound: [],
  questionSet: [],
  startTime: null,
  timerInterval: null
};

const elements = {
  playSound: document.getElementById("playSound"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  nextQuestion: document.getElementById("nextQuestion"),
  questionProgress: document.getElementById("questionProgress"),
  scoreResult: document.getElementById("scoreResult"),
  timeResult: document.getElementById("timeResult"),
  wrongList: document.getElementById("wrongList"),
  resultCard: document.getElementById("resultCard"),
  gameCard: document.getElementById("gameCard"),
  restartGame: document.getElementById("restartGame"),
  starCount: document.getElementById("starCount"),
  streakCount: document.getElementById("streakCount"),
  timeCount: document.getElementById("timeCount"),
  openSticker: document.getElementById("openSticker"),
  closeSticker: document.getElementById("closeSticker"),
  stickerPage: document.getElementById("stickerPage"),
  stickerGrid: document.getElementById("stickerGrid"),
  starAnimation: document.getElementById("starAnimation")
};

const audioPlayer = new Audio();
audioPlayer.preload = "auto";

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

const formatTime = (elapsedMs) => {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const buildQuestionSet = () => {
  const wrongQueue = getStoredArray(STORAGE_KEYS.wrongQueue);
  const wrongPool = phonicsPool.filter((item) => wrongQueue.includes(item.combo));
  const available = phonicsPool.filter((item) => !wrongQueue.includes(item.combo));

  const prioritized = shuffle(wrongPool).concat(shuffle(available));
  return prioritized.slice(0, state.totalQuestions);
};

const playPhonicsAudio = (audioSrc) => {
  if (!audioSrc) return;
  if (audioPlayer.src !== audioSrc) {
    audioPlayer.src = audioSrc;
  }
  audioPlayer.currentTime = 0;
  audioPlayer
    .play()
    .catch(() => {
      // Autoplay might be blocked until a user interaction.
    });
};

const updateStats = () => {
  elements.streakCount.textContent = state.streak;
  elements.starCount.textContent = getStars();
};

const updateTimer = () => {
  if (!state.startTime) return;
  elements.timeCount.textContent = formatTime(Date.now() - state.startTime);
};

const startTimer = () => {
  state.startTime = Date.now();
  updateTimer();
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }
  state.timerInterval = setInterval(updateTimer, 1000);
};

const stopTimer = () => {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
};

const buildOptions = (answer) => {
  const pool = phonicsPool.filter((item) => item.combo !== answer.combo);
  const distractors = shuffle(pool).slice(0, 2);
  return shuffle([answer, ...distractors]);
};

const renderQuestion = () => {
  state.currentQuestion = state.questionSet[state.currentIndex];
  if (!state.currentQuestion) return;

  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.totalQuestions} 题`;
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.nextQuestion.disabled = true;

  const options = buildOptions(state.currentQuestion);
  elements.options.innerHTML = "";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = option.combo;
    button.addEventListener("click", () => handleAnswer(button, option));
    elements.options.appendChild(button);
  });

  playPhonicsAudio(state.currentQuestion.audio);
};

const updateWrongQueue = (combo, isCorrect) => {
  const wrongQueue = new Set(getStoredArray(STORAGE_KEYS.wrongQueue));
  if (!isCorrect) {
    wrongQueue.add(combo);
  } else {
    wrongQueue.delete(combo);
  }
  setStoredArray(STORAGE_KEYS.wrongQueue, Array.from(wrongQueue));
};

const showStarAnimation = () => {
  elements.starAnimation.classList.add("show");
  setTimeout(() => {
    elements.starAnimation.classList.remove("show");
  }, 800);
};

const handleAnswer = (button, option) => {
  const isCorrect = option.combo === state.currentQuestion.combo;
  const optionButtons = Array.from(elements.options.querySelectorAll("button"));
  optionButtons.forEach((btn) => {
    btn.disabled = true;
    const isAnswer = btn.textContent === state.currentQuestion.combo;
    if (isAnswer) {
      btn.classList.add("correct");
    }
  });

  if (isCorrect) {
    state.score += 1;
    state.streak += 1;
    elements.feedback.textContent = "太棒啦！答对了！";
    elements.feedback.classList.add("success");
    if (state.streak % 3 === 0) {
      const stars = getStars() + 1;
      setStars(stars);
      showStarAnimation();
    }
  } else {
    state.streak = 0;
    button.classList.add("wrong");
    elements.feedback.textContent = `再试试～正确答案是 ${state.currentQuestion.combo}`;
    elements.feedback.classList.add("error");
    state.wrongThisRound.push(state.currentQuestion.combo);
  }

  updateWrongQueue(state.currentQuestion.combo, isCorrect);
  updateStats();
  elements.nextQuestion.disabled = false;
};

const showResults = () => {
  stopTimer();
  const elapsed = formatTime(Date.now() - state.startTime);
  elements.scoreResult.textContent = state.score;
  elements.timeResult.textContent = elapsed;
  elements.gameCard.classList.add("hidden");
  elements.resultCard.classList.remove("hidden");

  if (state.wrongThisRound.length === 0) {
    elements.wrongList.innerHTML = "<span>满分！没有错题～</span>";
  } else {
    const uniqueWrong = [...new Set(state.wrongThisRound)];
    elements.wrongList.innerHTML = `<span>错题复习：</span>${uniqueWrong
      .map((item) => `<p>👉 ${item}</p>`)
      .join("")}`;
  }
};

const nextQuestion = () => {
  if (state.currentIndex >= state.totalQuestions - 1) {
    showResults();
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
};

const startGame = () => {
  state.currentIndex = 0;
  state.score = 0;
  state.streak = 0;
  state.wrongThisRound = [];
  state.questionSet = buildQuestionSet();
  elements.gameCard.classList.remove("hidden");
  elements.resultCard.classList.add("hidden");
  updateStats();
  startTimer();
  renderQuestion();
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

const init = () => {
  updateStats();
  startGame();
};

elements.playSound.addEventListener("click", () => {
  if (state.currentQuestion) {
    playPhonicsAudio(state.currentQuestion.audio);
  }
});

elements.nextQuestion.addEventListener("click", nextQuestion);

elements.restartGame.addEventListener("click", startGame);

elements.openSticker.addEventListener("click", () => toggleSticker(true));

elements.closeSticker.addEventListener("click", () => toggleSticker(false));

elements.stickerPage.addEventListener("click", (event) => {
  if (event.target === elements.stickerPage) {
    toggleSticker(false);
  }
});

init();
