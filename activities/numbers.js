const numberSessionLength = 8;
const numberPoolLevelOne = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const numberPoolLevelTwo = ["1", "2", "3", "4", "5"];
const countIcons = ["⭐", "🌸", "💖", "🦋", "🍩", "☁️"];

const numbersPrompt = document.querySelector("#numbers-prompt");
const numbersPromptLabel = document.querySelector("#numbers-prompt-label");
const numbersCountBoard = document.querySelector("#numbers-count-board");
const numbersOptions = document.querySelector("#numbers-options");
const numbersFeedback = document.querySelector("#numbers-feedback");
const numbersFeedbackIcon = document.querySelector("#numbers-feedback-icon");
const numbersFeedbackText = document.querySelector("#numbers-feedback-text");
const numbersRoundLabel = document.querySelector("#numbers-round-label");
const numbersScoreLabel = document.querySelector("#numbers-score-label");
const numbersProgress = document.querySelector("#numbers-progress");
const numbersFinish = document.querySelector("#numbers-finish");
const numbersFinishText = document.querySelector("#numbers-finish-text");
const numbersBoard = document.querySelector(".numbers-board");
const numbersPlayAgainButton = document.querySelector("#numbers-play-again-button");
const numbersLevelOneButton = document.querySelector("#numbers-level-one-button");
const numbersLevelTwoButton = document.querySelector("#numbers-level-two-button");

let numbersRounds = [];
let lastNumbersSignature = "";
let numbersRound = 0;
let numbersScore = 0;
let numbersAnswered = false;
let numbersLevel = "level1";
let audioContext;

function buildCountItems(target) {
  const icon = countIcons[Math.floor(Math.random() * countIcons.length)];
  return Array.from({ length: Number(target) }, () => icon);
}

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

function renderNumbersProgress() {
  numbersProgress.innerHTML = "";

  Array.from({ length: numberSessionLength }).forEach((_, index) => {
    const star = document.createElement("span");
    star.className = index < numbersScore ? "numbers-progress-star is-filled" : "numbers-progress-star";
    star.textContent = index < numbersScore ? "⭐" : "✦";
    numbersProgress.append(star);
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

function playNumbersWinSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  playTone(523.25, start, 0.14, 0.08);
  playTone(659.25, start + 0.08, 0.18, 0.07);
}

function playNumbersFinishSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    playTone(frequency, start + index * 0.12, 0.24, 0.08);
  });
}

function speakPrompt() {
  const round = numbersRounds[numbersRound];
  const message =
    numbersLevel === "level1"
      ? `Find the number ${round.target}.`
      : `Count them. How many do you see?`;

  if (!("speechSynthesis" in window)) {
    numbersFeedbackText.textContent = message;
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function resetNumbersFeedback() {
  numbersFeedback.classList.remove("is-correct", "is-wrong");
  numbersFeedbackIcon.textContent = "✨";
  numbersFeedbackText.textContent =
    numbersLevel === "level1" ? "Tap the matching number." : "Count and tap the number.";
}

function renderCountBoard(round) {
  numbersCountBoard.innerHTML = "";
  numbersCountBoard.hidden = numbersLevel !== "level2";

  if (numbersLevel !== "level2") {
    return;
  }

  round.items.forEach((icon) => {
    const item = document.createElement("span");
    item.className = "numbers-count-item";
    item.textContent = icon;
    numbersCountBoard.append(item);
  });
}

function renderNumbersRound() {
  const round = numbersRounds[numbersRound];

  numbersAnswered = false;
  numbersPrompt.disabled = false;
  numbersPrompt.textContent = numbersLevel === "level1" ? "⭐" : "✨";
  numbersPromptLabel.textContent = numbersLevel === "level1" ? "Listen and find" : "Count the stars";
  numbersRoundLabel.textContent = `${numbersRound + 1} / ${numberSessionLength}`;
  numbersScoreLabel.textContent = String(numbersScore);
  renderNumbersProgress();
  numbersOptions.innerHTML = "";
  resetNumbersFeedback();
  renderCountBoard(round);

  round.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "numbers-option";
    button.textContent = choice;
    button.setAttribute("aria-label", `Choose number ${choice}`);
    button.addEventListener("click", () => chooseNumber(choice, button));
    numbersOptions.append(button);
  });

  trackEvent({
    type: "prompt",
    game: "numbers",
    level: numbersLevel,
    round: numbersRound + 1,
    target: round.target,
    choices: round.choices,
  });
}

function finishNumbers() {
  numbersBoard.hidden = true;
  numbersFinish.hidden = false;
  numbersFinishText.textContent = `Morgan found ${numbersScore} star numbers!`;
  trackEvent({
    type: "session_complete",
    game: "numbers",
    level: numbersLevel,
    score: numbersScore,
    rounds: numberSessionLength,
  });
  playNumbersFinishSound();
}

function nextNumbersRound() {
  numbersBoard.classList.remove("numbers-celebrate", "numbers-shake");
  numbersRound += 1;

  if (numbersRound >= numberSessionLength) {
    finishNumbers();
    return;
  }

  renderNumbersRound();
  speakPrompt();
}

function chooseNumber(choice, button) {
  if (numbersAnswered) {
    return;
  }

  const round = numbersRounds[numbersRound];
  const buttons = document.querySelectorAll(".numbers-option");

  if (choice === round.target) {
    trackEvent({
      type: "answer",
      game: "numbers",
      level: numbersLevel,
      round: numbersRound + 1,
      target: round.target,
      choice,
      correct: true,
    });
    numbersAnswered = true;
    numbersScore += 1;
    numbersScoreLabel.textContent = String(numbersScore);
    renderNumbersProgress();
    button.classList.add("is-correct");
    numbersFeedback.classList.add("is-correct");
    numbersFeedbackIcon.textContent = "⭐";
    numbersFeedbackText.textContent =
      numbersLevel === "level1" ? `You found ${round.target}!` : `${round.target} stars!`;
    numbersPrompt.textContent = round.target;
    numbersBoard.classList.remove("numbers-shake");
    numbersBoard.classList.add("numbers-celebrate");
    numbersPrompt.disabled = true;
    playNumbersWinSound();
    buttons.forEach((item) => {
      item.disabled = true;
    });
    window.setTimeout(nextNumbersRound, 1800);
    return;
  }

  trackEvent({
    type: "answer",
    game: "numbers",
    level: numbersLevel,
    round: numbersRound + 1,
    target: round.target,
    choice,
    correct: false,
  });
  button.classList.add("is-wrong");
  numbersFeedback.classList.remove("is-correct");
  numbersFeedback.classList.add("is-wrong");
  numbersFeedbackIcon.textContent = "💫";
  numbersFeedbackText.textContent = "Try another one.";
  numbersBoard.classList.remove("numbers-celebrate", "numbers-shake");
  void numbersBoard.offsetWidth;
  numbersBoard.classList.add("numbers-shake");
}

function buildNumbersRounds() {
  const pool = numbersLevel === "level1" ? numberPoolLevelOne : numberPoolLevelTwo;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const rounds = shuffle(pool)
      .slice(0, numberSessionLength)
      .map((target) => {
        const wrongChoices = shuffle(pool.filter((number) => number !== target)).slice(0, 2);
        return {
          target,
          choices: shuffle([target, ...wrongChoices]),
          items: numbersLevel === "level2" ? buildCountItems(target) : [],
        };
      });

    const signature = rounds.map((round) => round.target).join("-");
    if (signature !== lastNumbersSignature) {
      lastNumbersSignature = signature;
      return rounds;
    }
  }

  const fallbackRounds = shuffle(pool)
    .slice(0, numberSessionLength)
    .map((target) => {
      const wrongChoices = shuffle(pool.filter((number) => number !== target)).slice(0, 2);
      return {
        target,
        choices: shuffle([target, ...wrongChoices]),
        items: numbersLevel === "level2" ? buildCountItems(target) : [],
      };
    });

  lastNumbersSignature = fallbackRounds.map((round) => round.target).join("-");
  return fallbackRounds;
}

function restartNumbers() {
  numbersRound = 0;
  numbersScore = 0;
  numbersAnswered = false;
  numbersRounds = buildNumbersRounds();
  numbersFinish.hidden = true;
  numbersBoard.hidden = false;
  renderNumbersRound();
  speakPrompt();
}

function setNumbersLevel(level) {
  numbersLevel = level;
  numbersLevelOneButton.classList.toggle("is-active", level === "level1");
  numbersLevelTwoButton.classList.toggle("is-active", level === "level2");
  restartNumbers();
}

numbersPrompt.addEventListener("click", speakPrompt);
numbersPlayAgainButton.addEventListener("click", restartNumbers);
numbersLevelOneButton.addEventListener("click", () => setNumbersLevel("level1"));
numbersLevelTwoButton.addEventListener("click", () => setNumbersLevel("level2"));

numbersRounds = buildNumbersRounds();
renderNumbersRound();
speakPrompt();
