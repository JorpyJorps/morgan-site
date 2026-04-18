// ── Pirouette character helpers ───────────────────────────────────────────

function getPirouetteEmoji() {
  return localStorage.getItem('morgan_pirouette_animal_v1') === 'penguin' ? '🐧' : '🐱';
}

function setPirouette(state, bubbleText) {
  const cat = document.getElementById('gpCat');
  const bubble = document.getElementById('gpBubble');
  const text = document.getElementById('gpBubbleText');
  if (!cat) return;
  cat.textContent = getPirouetteEmoji();
  if (text && bubbleText) text.textContent = bubbleText;
  // Remove all state classes, add new one
  const gp = document.getElementById('gamePirouette');
  if (gp) {
    gp.className = 'game-pirouette';
    if (state) gp.classList.add('gp-' + state);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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

// Pick the warmest available voice. On iOS/macOS "Samantha" is noticeably
// better than the default; Chrome desktop has "Google US English".
// We cache the result so we don't scan the list on every prompt.
let _bestVoice = null;
function getBestVoice() {
  if (_bestVoice) return _bestVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = [
    "Samantha",           // iOS / macOS — warm & clear
    "Karen",              // macOS alternate
    "Google US English",  // Chrome desktop — much better than system default
    "Microsoft Aria Online (Natural)",  // Edge / Windows
    "Microsoft Zira",     // Windows fallback
  ];
  for (const name of preferred) {
    const match = voices.find((v) => v.name === name);
    if (match) { _bestVoice = match; return match; }
  }
  // Any en-US voice beats the system default on most platforms
  const enUS = voices.find((v) => v.lang === "en-US");
  _bestVoice = enUS || voices[0] || null;
  return _bestVoice;
}

const promptTemplates = [
  (t) => `Find the letter ${t}!`,
  (t) => `Can you find the letter ${t}?`,
  (t) => `Where is the letter ${t}?`,
  (t) => `Tap the letter ${t}!`,
  (t) => `Show me the letter ${t}!`,
];

function speakLetterPrompt() {
  const round = letterRounds[lettersRound];
  const template = promptTemplates[lettersRound % promptTemplates.length];
  const message = template(round.target);

  if (!("speechSynthesis" in window)) {
    lettersFeedbackText.textContent = message;
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.82;    // a touch slower — easier for a 5-year-old
  utterance.pitch = 1.1;
  utterance.volume = 1;
  const voice = getBestVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

// Chrome loads voices async — reset cache when they arrive so next speak picks the best one
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => { _bestVoice = null; });
}

// Wrap the initial auto-speak so it waits for voices to load on Chrome
function speakWhenReady() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    speakLetterPrompt();
  } else {
    // Chrome: voices arrive via event, not immediately
    window.speechSynthesis.addEventListener("voiceschanged", speakLetterPrompt, { once: true });
  }
}

function resetLettersFeedback() {
  lettersFeedback.classList.remove("is-correct", "is-wrong");
  lettersFeedbackIcon.textContent = "✨";
  lettersFeedbackText.textContent = "Listen and find the letter! 🎵";
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
  lettersPrompt.innerHTML = '<span class="letters-prompt-icon">🔊</span><span class="letters-prompt-hint">Hear it!</span>';
  lettersPrompt.disabled = false;
  setPirouette('idle', '🎵');
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

const glitterEmojis = ["✨", "🌸", "⭐", "💖", "🌟", "🦋", "🌺", "💫", "🎀", "🌷"];

function spawnGlitter() {
  const stage = document.getElementById("lettersGlitterStage");
  if (!stage) return;
  stage.innerHTML = "";

  const count = 28;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    dot.className = "glitter-dot";
    dot.textContent = glitterEmojis[Math.floor(Math.random() * glitterEmojis.length)];

    // Random horizontal position across the card
    const leftPct = 5 + Math.random() * 90;
    const drift = Math.round((Math.random() - 0.5) * 80);
    const spin = Math.round((Math.random() < 0.5 ? 1 : -1) * (180 + Math.random() * 360));
    const dur = Math.round(900 + Math.random() * 800);
    const delay = Math.round(Math.random() * 600);

    dot.style.left = `${leftPct}%`;
    dot.style.setProperty("--drift", `${drift}px`);
    dot.style.setProperty("--spin", `${spin}deg`);
    dot.style.setProperty("--dur", `${dur}ms`);
    dot.style.setProperty("--delay", `${delay}ms`);
    stage.append(dot);
  }
}

function finishLetters() {
  lettersBoard.hidden = true;
  lettersFinish.hidden = false;
  lettersFinishText.textContent = `Morgan found ${lettersScore} magic letters!`;
  lettersCelebration.classList.remove("is-active");
  spawnGlitter();
  setPirouette('celebrate', 'Magnifique! 🌟');
  const finishCat = document.getElementById('gpFinishCat');
  if (finishCat) finishCat.textContent = getPirouetteEmoji();
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
  }, 120);
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
    lettersPrompt.innerHTML = '<span class="letters-prompt-icon">🔊</span><span class="letters-prompt-hint">Hear it!</span>';
    setPirouette('celebrate', 'Magnifique! 🌟');
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
  lettersFeedbackText.textContent = "Hmm... try again! 💫";
  setPirouette('thinking', 'Hmm... try again! 💫');
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

// Build a weighted pool that over-indexes on letters Morgan has missed before.
// Missed letters get extra entries so they come up more often — but gently,
// not so much it feels like a punishment loop.
function buildWeightedPool() {
  const events = window.MorganTracker?.read() || [];
  const wrongCounts = {};

  events
    .filter(e => e.game === "letters" && e.type === "answer" && !e.correct)
    .forEach(e => {
      if (e.target) wrongCounts[e.target] = (wrongCounts[e.target] || 0) + 1;
    });

  const pool = [];
  lettersPool.forEach(letter => {
    const misses = wrongCounts[letter] || 0;
    // 1 base entry + up to 2 bonus entries for letters she struggles with
    const weight = 1 + Math.min(misses, 2);
    for (let i = 0; i < weight; i++) pool.push(letter);
  });

  return pool;
}

function buildLetterRounds() {
  const pool = buildWeightedPool();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const rounds = shuffle(pool)
      .filter((letter, index, arr) => arr.indexOf(letter) === index) // dedupe after shuffle
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

// Set Pirouette animal immediately from localStorage
const gpCatInit = document.getElementById('gpCat');
if (gpCatInit) gpCatInit.textContent = getPirouetteEmoji();
const gpFinishCatInit = document.getElementById('gpFinishCat');
if (gpFinishCatInit) gpFinishCatInit.textContent = getPirouetteEmoji();

renderLettersRound();
speakWhenReady();   // waits for voices to load on Chrome before first speak
setPirouette('idle', 'Find the letter! 🎵');
