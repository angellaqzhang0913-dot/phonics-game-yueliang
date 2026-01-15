const CONFIG = {
  normalRate: 1.0,
  slowRate: 0.35,
  playerHP: 3,
  monsterHP: 5,
  feedbackDelayMs: 900,
  nextRoundDelayMs: 500,
};

const QUESTION_BANK = [
  { id: "w01", word: "thin", options: ["thin", "sin", "zin"], correct: "thin", pattern: "th", level: 1 },
  { id: "w02", word: "ship", options: ["ship", "sip", "sheep"], correct: "ship", pattern: "sh", level: 1 },
  { id: "w03", word: "chat", options: ["chat", "cat", "chit"], correct: "chat", pattern: "ch", level: 1 },
  { id: "w04", word: "song", options: ["song", "sung", "sang"], correct: "song", pattern: "o", level: 1 },
  { id: "w05", word: "cake", options: ["cake", "cack", "cane"], correct: "cake", pattern: "a_e", level: 2 },
  { id: "w06", word: "train", options: ["train", "trin", "trane"], correct: "train", pattern: "ai", level: 2 },
  { id: "w07", word: "moon", options: ["moon", "mon", "moan"], correct: "moon", pattern: "oo", level: 2 },
  { id: "w08", word: "green", options: ["green", "gren", "grain"], correct: "green", pattern: "ee", level: 2 },
  { id: "w09", word: "fish", options: ["fish", "fesh", "fist"], correct: "fish", pattern: "i", level: 1 },
  { id: "w10", word: "duck", options: ["duck", "dock", "duke"], correct: "duck", pattern: "u", level: 1 },
  { id: "w11", word: "star", options: ["star", "stir", "stor"], correct: "star", pattern: "ar", level: 2 },
  { id: "w12", word: "tree", options: ["tree", "tray", "treat"], correct: "tree", pattern: "ee", level: 2 },
  { id: "w13", word: "book", options: ["book", "buck", "boot"], correct: "book", pattern: "oo", level: 2 },
  { id: "w14", word: "ring", options: ["ring", "rang", "rink"], correct: "ring", pattern: "ng", level: 2 },
  { id: "w15", word: "snow", options: ["snow", "snaw", "show"], correct: "snow", pattern: "ow", level: 3 },
  { id: "w16", word: "light", options: ["light", "lait", "lit"], correct: "light", pattern: "igh", level: 3 },
  { id: "w17", word: "phone", options: ["phone", "fone", "phon"], correct: "phone", pattern: "ph", level: 3 },
  { id: "w18", word: "whale", options: ["whale", "wale", "while"], correct: "whale", pattern: "wh", level: 3 },
  { id: "w19", word: "broom", options: ["broom", "brom", "broam"], correct: "broom", pattern: "oo", level: 2 },
  { id: "w20", word: "night", options: ["night", "nite", "net"], correct: "night", pattern: "igh", level: 3 },
];

const STATE = {
  BOOT: "BOOT",
  INTRO: "INTRO",
  LISTEN: "LISTEN",
  CHOOSE: "CHOOSE",
  FEEDBACK: "FEEDBACK",
  WIN: "WIN",
  LOSE: "LOSE",
};

const elements = {
  roundText: document.getElementById("roundText"),
  monsterHpFill: document.getElementById("monsterHpFill"),
  playerHearts: document.getElementById("playerHearts"),
  scoreText: document.getElementById("scoreText"),
  battleMessage: document.getElementById("battleMessage"),
  girl: document.getElementById("girl"),
  monster: document.getElementById("monster"),
  girlEffect: document.getElementById("girlEffect"),
  monsterEffect: document.getElementById("monsterEffect"),
  options: Array.from(document.querySelectorAll(".option-card")),
  listenAgain: document.getElementById("listenAgain"),
  debugState: document.getElementById("debugState"),
  debugWord: document.getElementById("debugWord"),
  debugAnswer: document.getElementById("debugAnswer"),
  debugPattern: document.getElementById("debugPattern"),
  introOverlay: document.getElementById("introOverlay"),
  resultOverlay: document.getElementById("resultOverlay"),
  rewardOverlay: document.getElementById("rewardOverlay"),
  resultTitle: document.getElementById("resultTitle"),
  resultCorrect: document.getElementById("resultCorrect"),
  resultWrong: document.getElementById("resultWrong"),
  resultTime: document.getElementById("resultTime"),
  startGame: document.getElementById("startGame"),
  restartGame: document.getElementById("restartGame"),
  nextMonster: document.getElementById("nextMonster"),
  playAgain: document.getElementById("playAgain"),
  confetti: document.getElementById("confetti"),
  rewardCorrect: document.getElementById("rewardCorrect"),
  rewardWrong: document.getElementById("rewardWrong"),
  rewardTime: document.getElementById("rewardTime"),
};

const tts = (() => {
  let voices = [];
  let selectedVoice = null;
  let isSpeaking = false;

  const pickVoice = () => {
    voices = window.speechSynthesis.getVoices();
    selectedVoice =
      voices.find((voice) => voice.lang === "en-US") ||
      voices.find((voice) => voice.lang === "en-GB") ||
      voices.find((voice) => voice.lang.startsWith("en")) ||
      voices[0] ||
      null;
    console.log("[TTS] voices loaded", voices.length, "selected", selectedVoice?.name);
  };

  const ensureVoices = () => {
    if (!voices.length) {
      pickVoice();
    }
    if (!voices.length) {
      window.speechSynthesis.addEventListener("voiceschanged", pickVoice, { once: true });
    }
  };

  const speak = (word, rate) =>
    new Promise((resolve) => {
      if (!word) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = rate;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });

  const speakWordSequence = async (word) => {
    if (!window.speechSynthesis) {
      console.warn("[TTS] SpeechSynthesis not supported");
      return;
    }
    window.speechSynthesis.cancel();
    ensureVoices();
    if (isSpeaking) {
      console.log("[TTS] cancel previous queue");
    }
    isSpeaking = true;
    console.log("[TTS] speak sequence", word);
    await speak(word, CONFIG.normalRate);
    await speak(word, CONFIG.slowRate);
    isSpeaking = false;
  };

  const speakSlow = async (word) => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    ensureVoices();
    isSpeaking = true;
    console.log("[TTS] speak slow", word);
    await speak(word, CONFIG.slowRate);
    isSpeaking = false;
  };

  return {
    speakWordSequence,
    speakSlow,
    cancel: () => window.speechSynthesis.cancel(),
    get isSpeaking() {
      return isSpeaking;
    },
  };
})();

const game = {
  state: STATE.BOOT,
  round: 1,
  playerHP: CONFIG.playerHP,
  monsterHP: CONFIG.monsterHP,
  correctCount: 0,
  wrongCount: 0,
  usedIds: new Set(),
  currentQuestion: null,
  startTime: null,
};

const setState = (to, payload = {}) => {
  const from = game.state;
  game.state = to;
  console.log("[STATE]", from, "->", to, payload);
  elements.debugState.textContent = to;
};

const updateStats = () => {
  elements.roundText.textContent = `${game.round} / ${CONFIG.monsterHP}`;
  const hpPercent = Math.max((game.monsterHP / CONFIG.monsterHP) * 100, 0);
  elements.monsterHpFill.style.width = `${hpPercent}%`;
  elements.playerHearts.textContent = "❤️".repeat(Math.max(game.playerHP, 0));
  elements.scoreText.textContent = `${game.correctCount} / ${game.wrongCount}`;
};

const updateDebug = () => {
  elements.debugWord.textContent = game.currentQuestion?.word ?? "-";
  elements.debugAnswer.textContent = game.currentQuestion?.correct ?? "-";
  elements.debugPattern.textContent = game.currentQuestion?.pattern ?? "-";
};

const setOptionsEnabled = (enabled) => {
  elements.options.forEach((button) => {
    button.disabled = !enabled;
  });
};

const resetOptionStyles = () => {
  elements.options.forEach((button) => {
    button.classList.remove("is-correct", "is-wrong", "is-highlight");
  });
};

const pickQuestion = () => {
  let available = QUESTION_BANK.filter((question) => !game.usedIds.has(question.id));
  if (!available.length) {
    console.log("[QUESTION] pool exhausted, allowing repeats");
    game.usedIds.clear();
    available = QUESTION_BANK;
  }
  const question = available[Math.floor(Math.random() * available.length)];
  game.usedIds.add(question.id);
  console.log("[QUESTION] picked", question);
  return question;
};

const renderQuestion = () => {
  const question = pickQuestion();
  game.currentQuestion = question;
  elements.options.forEach((button, index) => {
    button.textContent = question.options[index];
  });
  updateDebug();
};

const playAttack = (attacker, target, effect) => {
  attacker.classList.add("attack");
  target.classList.add("hit");
  effect.classList.add("is-active");
  setTimeout(() => {
    attacker.classList.remove("attack");
    target.classList.remove("hit");
    effect.classList.remove("is-active");
  }, 400);
};

const showMessage = (text) => {
  elements.battleMessage.textContent = text;
};

const startRound = async () => {
  renderQuestion();
  resetOptionStyles();
  setOptionsEnabled(false);
  updateStats();
  showMessage("仔细听单词～");
  setState(STATE.LISTEN, { word: game.currentQuestion.word });
  await tts.speakWordSequence(game.currentQuestion.word);
  setState(STATE.CHOOSE);
  setOptionsEnabled(true);
  showMessage("选出正确拼写！");
};

const endGame = (resultState) => {
  setState(resultState);
  setOptionsEnabled(false);
  elements.listenAgain.disabled = true;
  const timeUsed = game.startTime ? Math.round((Date.now() - game.startTime) / 1000) : 0;
  elements.resultCorrect.textContent = game.correctCount;
  elements.resultWrong.textContent = game.wrongCount;
  elements.resultTime.textContent = `${timeUsed}s`;
  elements.rewardCorrect.textContent = game.correctCount;
  elements.rewardWrong.textContent = game.wrongCount;
  elements.rewardTime.textContent = `${timeUsed}s`;
  if (resultState === STATE.WIN) {
    elements.rewardOverlay.classList.add("is-visible");
    elements.rewardOverlay.setAttribute("aria-hidden", "false");
    launchConfetti();
  } else {
    elements.resultTitle.textContent = "挑战失败";
    elements.resultOverlay.classList.add("is-visible");
    elements.resultOverlay.setAttribute("aria-hidden", "false");
  }
};

const handleChoice = async (button) => {
  if (game.state !== STATE.CHOOSE) {
    return;
  }
  setState(STATE.FEEDBACK, { choice: button.textContent });
  setOptionsEnabled(false);

  const isCorrect = button.textContent === game.currentQuestion.correct;
  console.log("[ANSWER]", button.textContent, "isCorrect:", isCorrect);

  if (isCorrect) {
    button.classList.add("is-correct");
    game.correctCount += 1;
    game.monsterHP -= 1;
    playAttack(elements.girl, elements.monster, elements.girlEffect);
    showMessage("命中！怪兽受伤了！");
    updateStats();
    console.log("[HP] monster", game.monsterHP);
    await wait(CONFIG.nextRoundDelayMs);
    if (game.monsterHP <= 0) {
      endGame(STATE.WIN);
      return;
    }
    game.round += 1;
    startRound();
  } else {
    button.classList.add("is-wrong");
    const correctButton = elements.options.find(
      (option) => option.textContent === game.currentQuestion.correct
    );
    if (correctButton) {
      correctButton.classList.add("is-highlight");
    }
    game.wrongCount += 1;
    game.playerHP -= 1;
    playAttack(elements.monster, elements.girl, elements.monsterEffect);
    showMessage("再听一次慢速提示！");
    updateStats();
    console.log("[HP] player", game.playerHP);
    await wait(CONFIG.feedbackDelayMs);
    await tts.speakSlow(game.currentQuestion.word);
    await wait(300);
    if (game.playerHP <= 0) {
      endGame(STATE.LOSE);
      return;
    }
    game.round += 1;
    startRound();
  }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const resetGame = () => {
  game.round = 1;
  game.playerHP = CONFIG.playerHP;
  game.monsterHP = CONFIG.monsterHP;
  game.correctCount = 0;
  game.wrongCount = 0;
  game.usedIds.clear();
  game.currentQuestion = null;
  game.startTime = Date.now();
  elements.listenAgain.disabled = false;
  elements.resultOverlay.classList.remove("is-visible");
  elements.rewardOverlay.classList.remove("is-visible");
  elements.resultOverlay.setAttribute("aria-hidden", "true");
  elements.rewardOverlay.setAttribute("aria-hidden", "true");
  showMessage("新的怪兽出现了！");
  updateStats();
  updateDebug();
  startRound();
};

const launchConfetti = () => {
  elements.confetti.innerHTML = "";
  const colors = ["#ff7aa2", "#ffd166", "#6ecbff", "#7be495", "#b388ff"];
  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement("span");
    const size = 6 + Math.random() * 8;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.6}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 1.5}s`;
    elements.confetti.appendChild(piece);
  }
};

const init = () => {
  setState(STATE.BOOT);
  setState(STATE.INTRO);
  elements.introOverlay.classList.add("is-visible");
  elements.introOverlay.setAttribute("aria-hidden", "false");
  elements.listenAgain.addEventListener("click", async () => {
    if (game.state === STATE.FEEDBACK || game.state === STATE.WIN || game.state === STATE.LOSE) {
      return;
    }
    console.log("[UI] listen again");
    await tts.speakWordSequence(game.currentQuestion?.word);
  });

  elements.options.forEach((button) => {
    button.addEventListener("click", () => handleChoice(button));
  });

  elements.startGame.addEventListener("click", () => {
    setState(STATE.INTRO, { action: "start" });
    elements.introOverlay.classList.remove("is-visible");
    elements.introOverlay.setAttribute("aria-hidden", "true");
    resetGame();
  });

  elements.restartGame.addEventListener("click", () => {
    elements.resultTitle.textContent = "闯关结果";
    resetGame();
  });

  elements.playAgain.addEventListener("click", () => {
    resetGame();
  });

  elements.nextMonster.addEventListener("click", () => {
    resetGame();
  });
};

init();
