const lettersPool = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const sessionLength = 8;
let letterRounds = [];
let lastSessionSignature = "";

const lettersPrompt = document.querySelector("#letters-prompt");
const lettersOptions = document.querySelector("#letters-options");
const lettersFeedback = document.querySelector("#letters-feedback");
const lettersFeedbackIcon = document.querySelector("#letters-feedback-icon");
const lettersFeedbackText = document.querySelector("#letters-feedback-text");
const lettersRoundLabel = document.querySelector("#letters-round-label");
const lettersScoreLabel = document.querySelector("#letters-score-label");
const lettersProgress = document.querySelector("#letters-progress");
const lettersFinish = document.querySelector("#letters-finish");
const lettersFinishText = document.querySelector("#letters-finish-text");
const lettersCelebration = document.querySelector("#letters-celebration");
const lettersBoard = document.querySelector(".letters-board");
const lettersPlayAgainButton = document.querySelector("#letters-play-again-button");
const lettersLevelOneButton = document.querySelector("#letters-level-one-button");
const lettersLevelTwoButton = document.querySelector("#letters-level-two-button");

let lettersRound = 0;
let lettersScore = 0;
let lettersAnswered = false;
let audioContext;
let lettersLevel = "level1";

function trackEvent(event) {
  if (window.MorganTracker?.log) {
    window.MorganTracker.log(event);
  }
}

function renderLettersProgress() {
  lettersProgress.innerHTML = "";

  Array.from({ length: sessionLength }).forEach((_, index) => {
    const flower = document.createElement("span");
    flower.className = index < lettersScore ? "letters-progress-flower is-filled" : "letters-progress-flower";
    flower.textContent = index < lettersScore ? "🌸" : "✿";
    lettersProgress.append(flower);
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

function playLetterWinSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  playTone(587.33, start, 0.14, 0.07);
  playTone(783.99, start + 0.08, 0.18, 0.06);
}

function playLettersFinishSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((frequency, index) => {
    playTone(frequency, start + index * 0.12, 0.26, 0.085);
  });
  playTone(783.99, start + 0.72, 0.36, 0.06);
}

function speakLetterPrompt() {
  const round = letterRounds[lettersRound];
  const message = `Find the letter ${round.target}.`;

  if (!("speechSynthesis" in window)) {
    lettersFeedbackText.textContent = message;
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.88;
  utterance.pitch = 1.18;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function resetLettersFeedback() {
  lettersFeedback.classList.remove("is-correct", "is-wrong");
  lettersFeedbackIcon.textContent = "✨";
  lettersFeedbackText.textContent = "Tap the matching letter.";
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function renderLettersRound() {
  const round = letterRounds[lettersRound];

  lettersAnswered = false;
  lettersPrompt.textContent = "✨";
  lettersPrompt.disabled = false;
  lettersRoundLabel.textContent = `${lettersRound + 1} / ${sessionLength}`;
  lettersScoreLabel.textContent = String(lettersScore);
  renderLettersProgress();
  lettersOptions.innerHTML = "";
  resetLettersFeedback();

  shuffle(round.choices).forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letters-option";
    const displayChoice = lettersLevel === "level1" ? choice : choice.toLowerCase();
    button.textContent = displayChoice;
    button.setAttribute("aria-label", `Choose letter ${displayChoice}`);
    button.addEventListener("click", () => chooseLetter(choice, button));
    lettersOptions.append(button);
  });

  trackEvent({
    type: "prompt",
    game: "letters",
    level: lettersLevel,
    round: lettersRound + 1,
    target: round.target,
    choices: round.choices,
  });
}

function finishLetters() {
  lettersBoard.hidden = true;
  lettersFinish.hidden = false;
  lettersFinishText.textContent = `Morgan found ${lettersScore} magic letters!`;
  lettersCelebration.classList.remove("is-active");
  trackEvent({
    type: "session_complete",
    game: "letters",
    level: lettersLevel,
    score: lettersScore,
    rounds: sessionLength,
  });
  playLettersFinishSound();
  window.setTimeout(() => {
    lettersCelebration.classList.add("is-active");
  }, 180);
}

function nextLettersRound() {
  lettersBoard.classList.remove("letters-celebrate", "letters-shake");
  lettersRound += 1;

  if (lettersRound >= sessionLength) {
    finishLetters();
    return;
  }

  renderLettersRound();
  speakLetterPrompt();
}

function chooseLetter(choice, button) {
  if (lettersAnswered) {
    return;
  }

  const round = letterRounds[lettersRound];
  const buttons = document.querySelectorAll(".letters-option");

  if (choice === round.target) {
    trackEvent({
      type: "answer",
      game: "letters",
      level: lettersLevel,
      round: lettersRound + 1,
      target: round.target,
      choice,
      correct: true,
    });
    lettersAnswered = true;
    lettersScore += 1;
    lettersScoreLabel.textContent = String(lettersScore);
    renderLettersProgress();
    button.classList.add("is-correct");
    lettersFeedback.classList.add("is-correct");
    lettersFeedbackIcon.textContent = "🌸";
    lettersFeedbackText.textContent = `You found ${round.target}!`;
    lettersPrompt.textContent = round.target;
    lettersBoard.classList.remove("letters-shake");
    lettersBoard.classList.add("letters-celebrate");
    lettersPrompt.disabled = true;
    playLetterWinSound();
    buttons.forEach((item) => {
      item.disabled = true;
    });
    window.setTimeout(nextLettersRound, 1800);
    return;
  }

  trackEvent({
    type: "answer",
    game: "letters",
    level: lettersLevel,
    round: lettersRound + 1,
    target: round.target,
    choice,
    correct: false,
  });
  button.classList.add("is-wrong");
  lettersFeedback.classList.remove("is-correct");
  lettersFeedback.classList.add("is-wrong");
  lettersFeedbackIcon.textContent = "💫";
  lettersFeedbackText.textContent = "Try another one.";
  lettersBoard.classList.remove("letters-celebrate", "letters-shake");
  void lettersBoard.offsetWidth;
  lettersBoard.classList.add("letters-shake");
}

function restartLetters() {
  lettersRound = 0;
  lettersScore = 0;
  lettersAnswered = false;
  letterRounds = buildLetterRounds();
  lettersFinish.hidden = true;
  lettersCelebration.classList.remove("is-active");
  lettersBoard.hidden = false;
  renderLettersRound();
  speakLetterPrompt();
}

function setLettersLevel(level) {
  lettersLevel = level;
  lettersLevelOneButton.classList.toggle("is-active", level === "level1");
  lettersLevelTwoButton.classList.toggle("is-active", level === "level2");
  restartLetters();
}

function buildLetterRounds() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const rounds = shuffle(lettersPool)
      .slice(0, sessionLength)
      .map((target) => {
        const wrongChoices = shuffle(lettersPool.filter((letter) => letter !== target)).slice(0, 2);
        return {
          target,
          choices: shuffle([target, ...wrongChoices]),
        };
      });

    const signature = rounds.map((round) => round.target).join("-");
    if (signature !== lastSessionSignature) {
      lastSessionSignature = signature;
      return rounds;
    }
  }

  const fallbackRounds = shuffle(lettersPool)
    .slice(0, sessionLength)
    .map((target) => {
      const wrongChoices = shuffle(lettersPool.filter((letter) => letter !== target)).slice(0, 2);
      return {
        target,
        choices: shuffle([target, ...wrongChoices]),
      };
    });

  lastSessionSignature = fallbackRounds.map((round) => round.target).join("-");
  return fallbackRounds;
}

lettersPrompt.addEventListener("click", speakLetterPrompt);
lettersPlayAgainButton.addEventListener("click", restartLetters);
lettersLevelOneButton.addEventListener("click", () => setLettersLevel("level1"));
lettersLevelTwoButton.addEventListener("click", () => setLettersLevel("level2"));

letterRounds = buildLetterRounds();
renderLettersRound();
speakLetterPrompt();
