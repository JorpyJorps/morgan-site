const memoryThemes = {
  rainbow: ["🌈", "🦄", "⭐", "💖", "☁️", "🧚", "🎀", "🌸", "✨", "💜"],
  animals: ["🐱", "🐰", "🐶", "🐴", "🦋", "🐥", "🐸", "🐝", "🦄", "🐹"],
  sweets: ["🧁", "🍬", "🥧", "🍭", "🍪", "🍫", "🍓", "🍩", "🍦", "🍰"],
  morgan: ["🌈", "🐱", "💃", "⚽", "🦄", "🌸", "🐰", "🍩", "🦋", "💖"],
};

const themePicker = document.querySelector("#theme-picker");
const levelPicker = document.querySelector("#level-picker");
const memoryBoard = document.querySelector("#memory-board");
const matchesLabel = document.querySelector("#matches-label");
const turnsLabel = document.querySelector("#turns-label");
const memoryFeedback = document.querySelector("#memory-feedback");
const memoryFeedbackIcon = document.querySelector("#memory-feedback-icon");
const memoryFeedbackText = document.querySelector("#memory-feedback-text");
const memoryResetButton = document.querySelector("#memory-reset-button");
const memoryFinish = document.querySelector("#memory-finish");
const memoryFinishText = document.querySelector("#memory-finish-text");
const memoryBoardShell = document.querySelector(".memory-board-shell");
const memoryPlayAgainButton = document.querySelector("#memory-play-again-button");
const memoryCelebration = document.querySelector("#memory-celebration");
const memoryVoiceButton = document.querySelector("#memory-voice-button");
const memoryMatchCelebration = document.querySelector("#memory-match-celebration");

let currentTheme = "rainbow";
let currentLevel = "level1";
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let turns = 0;
let lockBoard = false;
let audioContext;

function trackEvent(event) {
  if (window.MorganTracker?.log) {
    window.MorganTracker.log(event);
  }
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, startTime, duration, volume) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playMatchSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  playTone(660, start, 0.16, 0.08);
  playTone(880, start + 0.08, 0.2, 0.06);
}

function playWinSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    playTone(frequency, start + index * 0.12, 0.28, 0.08);
  });
}

function speakMemoryHelp() {
  const message =
    currentLevel === "level1"
      ? "Tap two cards to find a match."
      : "Tap two cards to find a match. This level mixes two sticker worlds.";

  if (!("speechSynthesis" in window)) {
    updateFeedback("✨", message);
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.92;
  utterance.pitch = 1.15;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
  updateFeedback("✨", message);
}

function burstMatchCelebration() {
  memoryMatchCelebration.querySelectorAll(".memory-mini-burst").forEach((piece) => {
    piece.remove();
  });

  for (let index = 0; index < 8; index += 1) {
    const piece = document.createElement("span");
    piece.className = "memory-mini-burst";
    piece.textContent = ["✨", "⭐", "💖", "✦"][index % 4];
    piece.style.left = `${32 + Math.random() * 36}%`;
    piece.style.top = `${28 + Math.random() * 20}%`;
    piece.style.setProperty("--mini-x", `${Math.round((Math.random() - 0.5) * 90)}px`);
    piece.style.setProperty("--mini-y", `${-18 - Math.round(Math.random() * 46)}px`);
    memoryMatchCelebration.append(piece);
  }

  memoryMatchCelebration.classList.remove("is-active");
  void memoryMatchCelebration.offsetWidth;
  memoryMatchCelebration.classList.add("is-active");

  window.setTimeout(() => {
    memoryMatchCelebration.querySelectorAll(".memory-mini-burst").forEach((piece) => {
      piece.remove();
    });
    memoryMatchCelebration.classList.remove("is-active");
  }, 760);
}

function burstCelebration() {
  memoryCelebration.querySelectorAll(".memory-confetti").forEach((piece) => {
    piece.remove();
  });

  for (let index = 0; index < 22; index += 1) {
    const piece = document.createElement("span");
    piece.className = "memory-confetti";
    piece.textContent = ["✨", "⭐", "💖", "🌈"][index % 4];
    piece.style.left = `${8 + Math.random() * 84}%`;
    piece.style.top = `${4 + Math.random() * 20}%`;
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.setProperty("--confetti-x", `${Math.round((Math.random() - 0.5) * 180)}px`);
    piece.style.setProperty("--confetti-y", `${110 + Math.round(Math.random() * 120)}px`);
    memoryCelebration.append(piece);
  }

  memoryCelebration.classList.remove("is-active");
  void memoryCelebration.offsetWidth;
  memoryCelebration.classList.add("is-active");
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function getLevelCardCount() {
  return currentLevel === "level1" ? 4 : 6;
}

function getCardPool() {
  const baseTheme = memoryThemes[currentTheme];

  if (currentLevel === "level1") {
    return shuffle(baseTheme).slice(0, 4);
  }

  return shuffle(baseTheme).slice(0, 6);
}

function updateFeedback(icon, text, state) {
  memoryFeedback.classList.remove("is-correct", "is-wrong");
  memoryFeedbackIcon.textContent = icon;
  memoryFeedbackText.textContent = text;

  if (state) {
    memoryFeedback.classList.add(state);
  }
}

function updateStats() {
  matchesLabel.textContent = `${matchedPairs} / ${getLevelCardCount()}`;
  turnsLabel.textContent = String(turns);
}

function buildDeck() {
  const symbols = getCardPool();
  const deck = shuffle(
    symbols.flatMap((symbol, index) => [
      { id: `${symbol}-${index}-a`, symbol, matched: false },
      { id: `${symbol}-${index}-b`, symbol, matched: false },
    ])
  );

  return deck;
}

function renderBoard() {
  memoryBoard.innerHTML = "";
  memoryBoard.classList.toggle("memory-board-level-two", currentLevel === "level2");
  memoryBoard.dataset.theme = currentTheme;

  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card";
    button.dataset.cardId = card.id;
    button.setAttribute("aria-label", "Flip card");

    const inner = document.createElement("span");
    inner.className = "memory-card-inner";

    const front = document.createElement("span");
    front.className = "memory-card-face memory-card-front";
    front.textContent = "✦";

    const back = document.createElement("span");
    back.className = "memory-card-face memory-card-back";
    back.textContent = card.symbol;

    inner.append(front, back);
    button.append(inner);
    button.addEventListener("click", () => flipCard(card.id));
    memoryBoard.append(button);
  });
}

function syncCardViews() {
  document.querySelectorAll(".memory-card").forEach((button) => {
    const id = button.dataset.cardId;
    const card = cards.find((item) => item.id === id);
    const isFlipped = flippedCards.includes(id) || card.matched;

    button.classList.toggle("is-flipped", isFlipped);
    button.classList.toggle("is-matched", card.matched);
    button.disabled = card.matched || lockBoard;
  });
}

function resetGame() {
  cards = buildDeck();
  flippedCards = [];
  matchedPairs = 0;
  turns = 0;
  lockBoard = false;
  memoryFinish.hidden = true;
  memoryBoardShell.hidden = false;
  memoryCelebration.classList.remove("is-active");
  memoryMatchCelebration.classList.remove("is-active");
  memoryCelebration.querySelectorAll(".memory-confetti").forEach((piece) => {
    piece.remove();
  });
  memoryMatchCelebration.querySelectorAll(".memory-mini-burst").forEach((piece) => {
    piece.remove();
  });
  updateFeedback("✨", "Pick two cards.");
  updateStats();
  renderBoard();
  syncCardViews();
  trackEvent({
    type: "prompt",
    game: "memory-match",
    level: currentLevel,
    theme: currentTheme,
    pairs: getLevelCardCount(),
    symbols: [...new Set(cards.map((card) => card.symbol))],
  });
}

function finishGame() {
  memoryBoardShell.hidden = true;
  memoryFinish.hidden = false;
  memoryFinishText.textContent = `Morgan found all ${getLevelCardCount()} matches in ${turns} turns!`;
  trackEvent({
    type: "session_complete",
    game: "memory-match",
    level: currentLevel,
    theme: currentTheme,
    matches: matchedPairs,
    turns,
  });
  playWinSound();
  window.setTimeout(burstCelebration, 280);
}

function checkPair() {
  if (flippedCards.length < 2) {
    return;
  }

  lockBoard = true;
  const [firstId, secondId] = flippedCards;
  const firstCard = cards.find((card) => card.id === firstId);
  const secondCard = cards.find((card) => card.id === secondId);

  turns += 1;
  updateStats();

  if (firstCard.symbol === secondCard.symbol) {
    trackEvent({
      type: "answer",
      game: "memory-match",
      level: currentLevel,
      theme: currentTheme,
      first: firstCard.symbol,
      second: secondCard.symbol,
      correct: true,
    });
    firstCard.matched = true;
    secondCard.matched = true;
    matchedPairs += 1;
    flippedCards = [];
    lockBoard = false;
    updateFeedback("💖", "It's a match!", "is-correct");
    playMatchSound();
    burstMatchCelebration();
    syncCardViews();

    if (matchedPairs === getLevelCardCount()) {
      window.setTimeout(finishGame, 500);
    }

    return;
  }

  trackEvent({
    type: "answer",
    game: "memory-match",
    level: currentLevel,
    theme: currentTheme,
    first: firstCard.symbol,
    second: secondCard.symbol,
    correct: false,
  });
  updateFeedback("💫", "Try again.", "is-wrong");
  syncCardViews();

  window.setTimeout(() => {
    flippedCards = [];
    lockBoard = false;
    syncCardViews();
    updateFeedback("✨", "Pick two cards.");
  }, 850);
}

function flipCard(cardId) {
  if (lockBoard || flippedCards.includes(cardId)) {
    return;
  }

  flippedCards.push(cardId);
  syncCardViews();
  checkPair();
}

function setActiveChip(container, value, key) {
  container.querySelectorAll(".memory-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset[key] === value);
  });
}

themePicker.addEventListener("click", (event) => {
  const button = event.target.closest(".memory-chip");
  if (!button) {
    return;
  }

  currentTheme = button.dataset.theme;
  setActiveChip(themePicker, currentTheme, "theme");
  resetGame();
});

levelPicker.addEventListener("click", (event) => {
  const button = event.target.closest(".memory-chip");
  if (!button) {
    return;
  }

  currentLevel = button.dataset.level;
  setActiveChip(levelPicker, currentLevel, "level");
  resetGame();
});

memoryResetButton.addEventListener("click", resetGame);
memoryPlayAgainButton.addEventListener("click", resetGame);
memoryVoiceButton.addEventListener("click", speakMemoryHelp);

resetGame();
