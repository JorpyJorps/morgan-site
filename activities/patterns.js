const patternSets = {
  level1: [
    {
      sequence: ["🌸", "🌈", "🌸", "🌈", "🌸", "🌈", "🌸", "?"],
      answer: "🌈",
      choices: ["🌈", "⭐", "🦋"],
    },
    {
      sequence: ["🟣", "🟡", "🟣", "🟡", "🟣", "🟡", "🟣", "?"],
      answer: "🟡",
      choices: ["🟡", "🟣", "🔵"],
    },
    {
      sequence: ["⭐", "⭐", "💖", "⭐", "⭐", "💖", "⭐", "⭐", "?"],
      answer: "💖",
      choices: ["💖", "⭐", "🌸"],
    },
    {
      sequence: ["🦋", "🌸", "🦋", "🌸", "🦋", "🌸", "🦋", "?"],
      answer: "🌸",
      choices: ["🌸", "🐰", "🦋"],
    },
    {
      sequence: ["🩵", "💜", "🩵", "💜", "🩵", "💜", "🩵", "?"],
      answer: "💜",
      choices: ["🩵", "💜", "🩷"],
    },
    {
      sequence: ["🍩", "🧁", "🍩", "🧁", "🍩", "🧁", "🍩", "?"],
      answer: "🧁",
      choices: ["🍩", "🧁", "🍓"],
    },
    {
      sequence: ["⚽", "⭐", "⚽", "⭐", "⚽", "⭐", "⚽", "?"],
      answer: "⭐",
      choices: ["⭐", "⚽", "💖"],
    },
    {
      sequence: ["🦄", "🌈", "☁️", "🦄", "🌈", "☁️", "🦄", "🌈", "?"],
      answer: "☁️",
      choices: ["☁️", "🌈", "🦄"],
    },
  ],
  level2: [
    {
      sequence: ["🌸", "🌈", "🌸", "?", "🌸", "🌈", "🌸", "🌈"],
      answer: "🌈",
      choices: ["🌈", "🌸", "⭐"],
    },
    {
      sequence: ["⭐", "⭐", "💖", "⭐", "?", "💖", "⭐", "⭐"],
      answer: "⭐",
      choices: ["⭐", "💖", "🌸"],
    },
    {
      sequence: ["🍩", "🧁", "🍩", "🧁", "?", "🧁", "🍩", "🧁"],
      answer: "🍩",
      choices: ["🍩", "🧁", "🍓"],
    },
    {
      sequence: ["🦋", "🌸", "🦋", "🌸", "🦋", "?", "🦋", "🌸"],
      answer: "🌸",
      choices: ["🌸", "🦋", "🐰"],
    },
    {
      sequence: ["🩵", "💜", "🩵", "💜", "?", "💜", "🩵", "💜"],
      answer: "🩵",
      choices: ["🩵", "💜", "🩷"],
    },
    {
      sequence: ["⚽", "⭐", "⚽", "?", "⚽", "⭐", "⚽", "⭐"],
      answer: "⭐",
      choices: ["⭐", "⚽", "💖"],
    },
    {
      sequence: ["🦄", "🌈", "☁️", "🦄", "🌈", "?", "🦄", "🌈", "☁️"],
      answer: "☁️",
      choices: ["☁️", "🌈", "🦄"],
    },
    {
      sequence: ["💖", "💖", "⭐", "💖", "?", "⭐", "💖", "💖"],
      answer: "💖",
      choices: ["💖", "⭐", "🌸"],
    },
  ],
};

const patternRow = document.querySelector("#pattern-row");
const patternOptions = document.querySelector("#pattern-options");
const patternFeedback = document.querySelector("#pattern-feedback");
const feedbackIcon = document.querySelector("#feedback-icon");
const feedbackText = document.querySelector("#feedback-text");
const roundLabel = document.querySelector("#round-label");
const scoreLabel = document.querySelector("#score-label");
const nextRoundButton = document.querySelector("#next-round-button");
const finishPanel = document.querySelector("#pattern-finish");
const finishText = document.querySelector("#finish-text");
const playAgainButton = document.querySelector("#play-again-button");
const gameBoard = document.querySelector(".pattern-board");
const levelOneButton = document.querySelector("#level-one-button");
const levelTwoButton = document.querySelector("#level-two-button");

let currentLevel = "level1";
let currentRound = 0;
let score = 0;
let answered = false;
let audioContext;

function trackEvent(event) {
  if (window.MorganTracker?.log) {
    window.MorganTracker.log(event);
  }
}

function getCurrentRounds() {
  return patternSets[currentLevel];
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
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

function playPatternWinSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  playTone(587.33, start, 0.14, 0.07);
  playTone(783.99, start + 0.08, 0.18, 0.06);
}

function resetFeedback() {
  patternFeedback.classList.remove("is-correct", "is-wrong");
  feedbackIcon.textContent = "✨";
  feedbackText.textContent = currentLevel === "level1" ? "Pick the next one." : "Pick the missing sticker.";
}

function renderPattern() {
  const rounds = getCurrentRounds();
  const round = rounds[currentRound];
  const choices = shuffle(round.choices);

  answered = false;
  roundLabel.textContent = `${currentRound + 1} / ${rounds.length}`;
  scoreLabel.textContent = String(score);
  nextRoundButton.hidden = true;
  patternRow.innerHTML = "";
  patternOptions.innerHTML = "";
  resetFeedback();

  round.sequence.forEach((piece) => {
    const tile = document.createElement("div");
    tile.className = piece === "?" ? "pattern-tile pattern-tile-missing" : "pattern-tile";
    tile.textContent = piece;
    patternRow.append(tile);
  });

  choices.forEach((choice) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "pattern-option";
    option.textContent = choice;
    option.setAttribute("aria-label", `Choose ${choice}`);
    option.addEventListener("click", () => handleChoice(choice, option));
    patternOptions.append(option);
  });

  trackEvent({
    type: "prompt",
    game: "patterns",
    level: currentLevel,
    round: currentRound + 1,
    target: round.answer,
    sequence: round.sequence,
    choices: round.choices,
  });
}

function handleChoice(choice, option) {
  if (answered) {
    return;
  }

  const round = getCurrentRounds()[currentRound];
  const allOptions = document.querySelectorAll(".pattern-option");

  if (choice === round.answer) {
    trackEvent({
      type: "answer",
      game: "patterns",
      level: currentLevel,
      round: currentRound + 1,
      target: round.answer,
      choice,
      correct: true,
    });
    answered = true;
    score += 1;
    scoreLabel.textContent = String(score);
    option.classList.add("is-correct");
    patternFeedback.classList.add("is-correct");
    feedbackIcon.textContent = "🌈";
    feedbackText.textContent = "Magical job!";
    gameBoard.classList.remove("shake-board");
    gameBoard.classList.add("celebrate-board");
    nextRoundButton.hidden = true;

    const missingTile = document.querySelector(".pattern-tile-missing");
    if (missingTile) {
      missingTile.classList.remove("pattern-tile-missing");
      missingTile.textContent = round.answer;
    }

    allOptions.forEach((button) => {
      button.disabled = true;
    });

    playPatternWinSound();
    window.setTimeout(nextRound, 1600);

    return;
  }

  trackEvent({
    type: "answer",
    game: "patterns",
    level: currentLevel,
    round: currentRound + 1,
    target: round.answer,
    choice,
    correct: false,
  });
  option.classList.add("is-wrong");
  patternFeedback.classList.remove("is-correct");
  patternFeedback.classList.add("is-wrong");
  feedbackIcon.textContent = "💫";
  feedbackText.textContent = "Try another one.";
  gameBoard.classList.remove("celebrate-board");
  gameBoard.classList.remove("shake-board");
  void gameBoard.offsetWidth;
  gameBoard.classList.add("shake-board");
}

function showFinish() {
  gameBoard.hidden = true;
  finishPanel.hidden = false;
  finishText.textContent = `You found ${score} ${currentLevel === "level1" ? "rainbow" : "missing sticker"} patterns!`;
  trackEvent({
    type: "session_complete",
    game: "patterns",
    level: currentLevel,
    score,
    rounds: getCurrentRounds().length,
  });
}

function nextRound() {
  gameBoard.classList.remove("celebrate-board", "shake-board");
  currentRound += 1;

  if (currentRound >= getCurrentRounds().length) {
    showFinish();
    return;
  }

  renderPattern();
}

function restartGame() {
  currentRound = 0;
  score = 0;
  answered = false;
  finishPanel.hidden = true;
  gameBoard.hidden = false;
  renderPattern();
}

function setLevel(level) {
  currentLevel = level;
  currentRound = 0;
  score = 0;
  answered = false;
  finishPanel.hidden = true;
  gameBoard.hidden = false;
  levelOneButton.classList.toggle("is-active", level === "level1");
  levelTwoButton.classList.toggle("is-active", level === "level2");
  renderPattern();
}

nextRoundButton.addEventListener("click", nextRound);
playAgainButton.addEventListener("click", restartGame);
levelOneButton.addEventListener("click", () => setLevel("level1"));
levelTwoButton.addEventListener("click", () => setLevel("level2"));

renderPattern();
