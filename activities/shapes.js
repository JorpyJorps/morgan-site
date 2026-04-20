const shapesCatalog = [
  { id: "circle", name: "circle", filled: "●", outline: "◯", colorClass: "pink" },
  { id: "square", name: "square", filled: "■", outline: "□", colorClass: "sky" },
  { id: "triangle", name: "triangle", filled: "▲", outline: "△", colorClass: "yellow" },
  { id: "rectangle", name: "rectangle", filled: "▬", outline: "▭", colorClass: "mint" },
  { id: "oval", name: "oval", filled: "⬭", outline: "⬯", colorClass: "peach" },
  { id: "diamond", name: "diamond", filled: "◆", outline: "◇", colorClass: "mint" },
  { id: "star", name: "star", filled: "★", outline: "☆", colorClass: "lavender" },
  { id: "heart", name: "heart", filled: "♥", outline: "♡", colorClass: "peach" },
  { id: "crescent", name: "crescent", filled: "☾", outline: "☽", colorClass: "sky" },
  { id: "hexagon", name: "hexagon", filled: "⬢", outline: "⬡", colorClass: "yellow" },
];

const shapesSessionLength = 8;

const shapesPrompt = document.querySelector("#shapes-prompt");
const shapesPromptLabel = document.querySelector("#shapes-prompt-label");
const shapesOptions = document.querySelector("#shapes-options");
const shapesFeedback = document.querySelector("#shapes-feedback");
const shapesFeedbackIcon = document.querySelector("#shapes-feedback-icon");
const shapesFeedbackText = document.querySelector("#shapes-feedback-text");
const shapesRoundLabel = document.querySelector("#shapes-round-label");
const shapesScoreLabel = document.querySelector("#shapes-score-label");
const shapesProgress = document.querySelector("#shapes-progress");
const shapesFinish = document.querySelector("#shapes-finish");
const shapesFinishText = document.querySelector("#shapes-finish-text");
const shapesCelebration = document.querySelector("#shapes-celebration");
const shapesBoard = document.querySelector(".shapes-board");
const shapesPlayAgainButton = document.querySelector("#shapes-play-again-button");
const shapesLevelOneButton = document.querySelector("#shapes-level-one-button");
const shapesLevelTwoButton = document.querySelector("#shapes-level-two-button");

let shapesRounds = [];
let lastShapesSignature = "";
let shapesRound = 0;
let shapesScore = 0;
let shapesAnswered = false;
let shapesLevel = "level1";
let audioContext;

function trackEvent(event) {
  if (window.MorganTracker?.log) {
    window.MorganTracker.log(event);
  }
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function getPoolForLevel() {
  return shapesLevel === "level1" ? shapesCatalog.slice(0, 4) : shapesCatalog;
}

function renderShapesProgress() {
  shapesProgress.innerHTML = "";

  Array.from({ length: shapesSessionLength }).forEach((_, index) => {
    const bunny = document.createElement("span");
    bunny.className = index < shapesScore ? "shapes-progress-bunny is-filled" : "shapes-progress-bunny";
    bunny.textContent = index < shapesScore ? "🐰" : "✿";
    shapesProgress.append(bunny);
  });
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

function playShapesWinSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  playTone(523.25, start, 0.14, 0.08);
  playTone(698.46, start + 0.08, 0.18, 0.07);
}

function playShapesFinishSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  [523.25, 659.25, 783.99, 987.77].forEach((frequency, index) => {
    playTone(frequency, start + index * 0.12, 0.24, 0.08);
  });
}

function speakShapePrompt() {
  const round = shapesRounds[shapesRound];
  const message = `Find the ${round.target.name}.`;

  if (!("speechSynthesis" in window)) {
    shapesFeedbackText.textContent = message;
    return;
  }

  if (window.MorganVoice) {
    window.MorganVoice.speak(message, { rate: 0.88, pitch: 1.12 });
  } else {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.14;
    window.speechSynthesis.speak(utterance);
  }
}

function resetShapesFeedback() {
  shapesFeedback.classList.remove("is-correct", "is-wrong");
  shapesFeedbackIcon.textContent = "✨";
  shapesFeedbackText.textContent = "Tap the matching shape.";
}

function createShapeMarkup(shape, mode) {
  return mode === "outline" ? shape.outline : shape.filled;
}

function renderShapesRound() {
  const round = shapesRounds[shapesRound];

  shapesAnswered = false;
  shapesPrompt.disabled = false;
  shapesPrompt.textContent = "✨";
  shapesPrompt.classList.remove("is-outline");
  shapesPromptLabel.textContent = "Listen and find";
  shapesRoundLabel.textContent = `${shapesRound + 1} / ${shapesSessionLength}`;
  shapesScoreLabel.textContent = String(shapesScore);
  renderShapesProgress();
  shapesOptions.innerHTML = "";
  resetShapesFeedback();

  round.choices.forEach((shape) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `shapes-option shapes-option-${shape.id} shapes-option-${shape.colorClass}`;
    if (round.choiceMode === "outline") {
      button.classList.add("is-outline");
    }
    button.setAttribute("aria-label", `Choose ${shape.name}`);
    button.innerHTML = `
      <span class="shapes-option-mark">${createShapeMarkup(shape, round.choiceMode)}</span>
      <span class="shapes-option-name">${shape.name}</span>
    `;
    button.addEventListener("click", () => chooseShape(shape, button));
    shapesOptions.append(button);
  });

  trackEvent({
    type: "prompt",
    game: "shapes",
    level: shapesLevel,
    round: shapesRound + 1,
    target: round.target.name,
    choices: round.choices.map((shape) => shape.name),
  });
}

function finishShapes() {
  shapesBoard.hidden = true;
  shapesFinish.hidden = false;
  shapesFinishText.textContent = `Morgan found ${shapesScore} bunny shapes!`;
  shapesCelebration.classList.remove("is-active");
  trackEvent({
    type: "session_complete",
    game: "shapes",
    level: shapesLevel,
    score: shapesScore,
    rounds: shapesSessionLength,
  });
  playShapesFinishSound();
  window.setTimeout(() => {
    shapesCelebration.classList.add("is-active");
  }, 180);
}

function nextShapesRound() {
  shapesBoard.classList.remove("shapes-celebrate", "shapes-shake");
  shapesRound += 1;

  if (shapesRound >= shapesSessionLength) {
    finishShapes();
    return;
  }

  renderShapesRound();
  speakShapePrompt();
}

function chooseShape(choice, button) {
  if (shapesAnswered) {
    return;
  }

  const round = shapesRounds[shapesRound];
  const buttons = document.querySelectorAll(".shapes-option");

  if (choice.id === round.target.id) {
    trackEvent({
      type: "answer",
      game: "shapes",
      level: shapesLevel,
      round: shapesRound + 1,
      target: round.target.name,
      choice: choice.name,
      correct: true,
    });
    shapesAnswered = true;
    shapesScore += 1;
    shapesScoreLabel.textContent = String(shapesScore);
    renderShapesProgress();
    button.classList.add("is-correct");
    shapesFeedback.classList.add("is-correct");
    shapesFeedbackIcon.textContent = "🐰";
    shapesFeedbackText.textContent = `You found the ${round.target.name}!`;
    shapesPrompt.textContent = round.target.filled;
    shapesBoard.classList.remove("shapes-shake");
    shapesBoard.classList.add("shapes-celebrate");
    shapesPrompt.disabled = true;
    playShapesWinSound();
    buttons.forEach((item) => {
      item.disabled = true;
    });
    window.setTimeout(nextShapesRound, 1700);
    return;
  }

  trackEvent({
    type: "answer",
    game: "shapes",
    level: shapesLevel,
    round: shapesRound + 1,
    target: round.target.name,
    choice: choice.name,
    correct: false,
  });
  button.classList.add("is-wrong");
  shapesFeedback.classList.remove("is-correct");
  shapesFeedback.classList.add("is-wrong");
  shapesFeedbackIcon.textContent = "💫";
  shapesFeedbackText.textContent = "Try another one.";
  shapesBoard.classList.remove("shapes-celebrate", "shapes-shake");
  void shapesBoard.offsetWidth;
  shapesBoard.classList.add("shapes-shake");
}

function buildShapesRounds() {
  const pool = getPoolForLevel();
  const choiceCount = shapesLevel === "level1" ? 3 : 4;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const targets = [];

    while (targets.length < shapesSessionLength) {
      targets.push(...shuffle(pool));
    }

    const rounds = targets.slice(0, shapesSessionLength).map((target) => {
      const wrongChoices = shuffle(pool.filter((shape) => shape.id !== target.id)).slice(0, choiceCount - 1);
      return {
        target,
        choices: shuffle([target, ...wrongChoices]),
        choiceMode: shapesLevel === "level1" ? "filled" : "outline",
      };
    });

    const signature = rounds.map((round) => round.target.id).join("-");
    if (signature !== lastShapesSignature) {
      lastShapesSignature = signature;
      return rounds;
    }
  }

  const fallbackTargets = [];
  while (fallbackTargets.length < shapesSessionLength) {
    fallbackTargets.push(...shuffle(pool));
  }

  const fallback = fallbackTargets.slice(0, shapesSessionLength).map((target) => {
    const wrongChoices = shuffle(pool.filter((shape) => shape.id !== target.id)).slice(
      0,
      (shapesLevel === "level1" ? 3 : 4) - 1
    );
    return {
      target,
      choices: shuffle([target, ...wrongChoices]),
      choiceMode: shapesLevel === "level1" ? "filled" : "outline",
    };
  });

  lastShapesSignature = fallback.map((round) => round.target.id).join("-");
  return fallback;
}

function restartShapes() {
  shapesRound = 0;
  shapesScore = 0;
  shapesAnswered = false;
  shapesRounds = buildShapesRounds();
  shapesFinish.hidden = true;
  shapesCelebration.classList.remove("is-active");
  shapesBoard.hidden = false;
  renderShapesRound();
  speakShapePrompt();
}

function setShapesLevel(level) {
  shapesLevel = level;
  shapesLevelOneButton.classList.toggle("is-active", level === "level1");
  shapesLevelTwoButton.classList.toggle("is-active", level === "level2");
  restartShapes();
}

shapesPrompt.addEventListener("click", speakShapePrompt);
shapesPlayAgainButton.addEventListener("click", restartShapes);
shapesLevelOneButton.addEventListener("click", () => setShapesLevel("level1"));
shapesLevelTwoButton.addEventListener("click", () => setShapesLevel("level2"));

shapesRounds = buildShapesRounds();
renderShapesRound();
// Wait for Chrome's async voice list before auto-speaking
if ("speechSynthesis" in window && window.speechSynthesis.getVoices().length === 0) {
  window.speechSynthesis.addEventListener("voiceschanged", speakShapePrompt, { once: true });
} else {
  speakShapePrompt();
}
