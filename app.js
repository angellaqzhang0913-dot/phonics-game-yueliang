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
  streak: 0,
  totalQuestions: 10,
  currentQuestion: null,
  wrongThisRound: [],
  questionSet: [],
  startTime: null,
  timerInterval: null,
  isSpeaking: false,
  reviewNoticeTimeout: null
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
  reviewNotice: document.getElementById("reviewNotice"),
  promptArea: document.getElementById("promptArea")
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

const formatTime = (elapsedMs) => {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const setSpeakingStatus = (isSpeaking) => {
  state.isSpeaking = isSpeaking;
  elements.playSound.disabled = isSpeaking;
  elements.playSound.textContent = isSpeaking ? "正在朗读…" : "🔊 再听一次";
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

const updateStats = () => {
  elements.streakCount.textContent = state.streak;
  elements.starCount.textContent = getStars();
};

const updateTimer = () => {
  if (!state.startTime) return;
  elements.timeCount.textContent = formatTime(Date.now() - state.startTime);
};

const showReviewNotice = () => {
  if (!elements.reviewNotice) return;
  elements.reviewNotice.classList.add("show");
  if (state.reviewNoticeTimeout) {
    clearTimeout(state.reviewNoticeTimeout);
  }
  state.reviewNoticeTimeout = setTimeout(() => {
    elements.reviewNotice.classList.remove("show");
  }, 1400);
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

const renderQuestion = () => {
  state.currentQuestion = state.questionSet[state.currentIndex];
  if (!state.currentQuestion) return;

  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.totalQuestions} 题`;
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.nextQuestion.disabled = true;

  elements.options.innerHTML = "";

  const options = shuffle(state.currentQuestion.choices);
  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = option;
    button.addEventListener("click", () => handleAnswer(button, option));
    elements.options.appendChild(button);
  });

  speakPrompt(state.currentQuestion.prompt);
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

const showStarAnimation = () => {
  const origin = elements.promptArea || elements.gameCard;
  if (!origin || !elements.starCount) return;
  const originRect = origin.getBoundingClientRect();
  const targetRect = elements.starCount.getBoundingClientRect();
  const startX = originRect.left + originRect.width / 2;
  const startY = originRect.top + originRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const star = document.createElement("div");
  star.className = "star-fly";
  star.textContent = "⭐";
  star.style.left = `${startX}px`;
  star.style.top = `${startY}px`;
  star.style.setProperty("--dx", `${endX - startX}px`);
  star.style.setProperty("--dy", `${endY - startY}px`);
  document.body.appendChild(star);

  star.addEventListener("animationend", () => {
    star.remove();
  });
};

const handleAnswer = (button, option) => {
  const isCorrect = option === state.currentQuestion.answer;
  const optionButtons = Array.from(elements.options.querySelectorAll("button"));
  optionButtons.forEach((btn) => {
    btn.disabled = true;
    const isAnswer = btn.textContent === state.currentQuestion.answer;
    if (isAnswer) {
      btn.classList.add("correct");
    }
  });
  button.classList.add("selected");

  if (isCorrect) {
    state.score += 1;
    state.streak += 1;
    button.classList.add("celebrate");
    elements.feedback.textContent = "太棒啦！答对了！";
    elements.feedback.classList.add("success");
    const stars = getStars() + 1;
    setStars(stars);
    showStarAnimation();
  } else {
    state.streak = 0;
    button.classList.add("wrong");
    elements.feedback.textContent = `再试试～正确答案是 ${state.currentQuestion.answer}`;
    elements.feedback.classList.add("error");
    state.wrongThisRound.push(state.currentQuestion.prompt);
    showReviewNotice();
  }

  updateWrongQueue(state.currentQuestion.prompt, isCorrect);
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
  setSpeakingStatus(false);
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
    speakPrompt(state.currentQuestion.prompt);
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
