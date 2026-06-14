// ── Pirouette character helpers ───────────────────────────────────────────

function getPirouetteEmoji() {
  return localStorage.getItem('morgan_pirouette_animal_v1') === 'penguin' ? '🐧' : '🐱';
}

function setPirouette(state, bubbleText) {
  const cat = document.getElementById('gpCat');
  const text = document.getElementById('gpBubbleText');
  if (!cat) return;
  cat.textContent = getPirouetteEmoji();
  if (text && bubbleText) text.textContent = bubbleText;
  const gp = document.getElementById('gamePirouette');
  if (gp) {
    gp.className = 'game-pirouette';
    if (state) gp.classList.add('gp-' + state);
  }
}

// ── Number bands — the whole curriculum lives here ────────────────────────
// Adding a new range (21–30, 31–40 …) or going to 100 is a ONE-LINE change.
// `frames` is computed from the target, so each band just declares its range.
const NUMBER_BANDS = [
  { id: 'ones',  chip: '1–10',  range: [1, 10]  },
  { id: 'teens', chip: '11–20', range: [11, 20] },
  // To grow with Morgan, just uncomment / add bands:
  // { id: 'twenties', chip: '21–30', range: [21, 30] },
  // { id: 'thirties', chip: '31–40', range: [31, 40] },
];

const numberSessionLength = 8;
const STAR = '⭐';

const numbersLevels = document.querySelector("#numbers-levels");
const numbersPrompt = document.querySelector("#numbers-prompt");
const numbersTenFrame = document.querySelector("#numbers-tenframe");
const numbersOptions = document.querySelector("#numbers-options");
const numbersFeedback = document.querySelector("#numbers-feedback");
const numbersFeedbackIcon = document.querySelector("#numbers-feedback-icon");
const numbersFeedbackText = document.querySelector("#numbers-feedback-text");
const numbersRoundLabel = document.querySelector("#numbers-round-label");
const numbersScoreLabel = document.querySelector("#numbers-score-label");
const numbersProgress = document.querySelector("#numbers-progress");
const numbersFinish = document.querySelector("#numbers-finish");
const numbersFinishText = document.querySelector("#numbers-finish-text");
const numbersCelebration = document.querySelector("#numbers-celebration");
const numbersBoard = document.querySelector(".numbers-board");
const numbersPlayAgainButton = document.querySelector("#numbers-play-again-button");

let numbersRounds = [];
let lastNumbersSignature = "";
let numbersRound = 0;
let numbersScore = 0;
let numbersAnswered = false;
let activeBand = NUMBER_BANDS[0];
let audioContext;

function trackEvent(event) {
  if (window.MorganTracker?.log) window.MorganTracker.log(event);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function rangeNumbers(band) {
  const [lo, hi] = band.range;
  return Array.from({ length: hi - lo + 1 }, (_, i) => String(lo + i));
}

// ── Pre-recorded voice (Pirouette) with live-speech fallback ──────────────
// Plays warm pre-generated clips from /assets/audio. If a clip is missing or
// blocked, it quietly falls back to MorganVoice (Web Speech) so audio never
// fully breaks. Re-generate clips with scripts/generate-voice.sh.
const NumberAudio = {
  cache: {},
  el(key) {
    if (!this.cache[key]) {
      const a = new Audio(`/assets/audio/${key}.m4a`);
      a.preload = "auto";
      this.cache[key] = a;
    }
    return this.cache[key];
  },
  play(key, fallbackText) {
    const a = this.el(key);
    try { a.pause(); a.currentTime = 0; } catch (_) {}
    const p = a.play();
    if (p && p.catch) {
      p.catch(() => {
        if (fallbackText && window.MorganVoice) {
          window.MorganVoice.speak(fallbackText, { rate: 0.84, pitch: 1.1 });
        }
      });
    }
  },
  number(n) {
    this.play(`num-${n}`, String(n));
  },
};

function renderNumbersProgress() {
  numbersProgress.innerHTML = "";
  Array.from({ length: numberSessionLength }).forEach((_, index) => {
    const star = document.createElement("span");
    star.className = index < numbersScore ? "numbers-progress-star is-filled" : "numbers-progress-star";
    star.textContent = index < numbersScore ? STAR : "✦";
    numbersProgress.append(star);
  });
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtor();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, startTime, duration, volume) {
  const context = getAudioContext();
  if (!context) return;
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
  if (!context) return;
  const start = context.currentTime;
  playTone(587.33, start, 0.14, 0.07);
  playTone(783.99, start + 0.08, 0.18, 0.06);
}

function playNumbersFinishSound() {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((frequency, index) => {
    playTone(frequency, start + index * 0.12, 0.26, 0.085);
  });
  playTone(783.99, start + 0.72, 0.36, 0.06);
}

// ── Ten-frame: shows a teen number as a full ten + the extra ones, so
//    "fifteen" is VISIBLY "ten and five". This carries the teaching — Pirouette
//    never has to lecture (per the bible).
function renderTenFrames(target) {
  numbersTenFrame.innerHTML = "";
  const n = Number(target);
  const frameCount = Math.max(1, Math.ceil(n / 10));
  let filled = 0;

  for (let f = 0; f < frameCount; f += 1) {
    const frame = document.createElement("div");
    frame.className = "ten-frame";
    for (let c = 0; c < 10; c += 1) {
      const cell = document.createElement("span");
      cell.className = "ten-frame-cell";
      if (filled < n) {
        cell.classList.add("is-filled");
        cell.textContent = STAR;
        filled += 1;
      }
      frame.append(cell);
    }
    numbersTenFrame.append(frame);
  }
}

function speakTarget() {
  const round = numbersRounds[numbersRound];
  if (round) NumberAudio.number(round.target);
}

function speakWhenReady() {
  // Try to auto-play; browsers may block until first tap, which is fine —
  // the big "Hear it!" button replays on demand.
  speakTarget();
}

function resetNumbersFeedback() {
  numbersFeedback.classList.remove("is-correct", "is-wrong");
  numbersFeedbackIcon.textContent = "✨";
  numbersFeedbackText.textContent = "Listen and find the number! ⭐";
}

function renderNumbersRound() {
  const round = numbersRounds[numbersRound];

  numbersAnswered = false;
  numbersPrompt.disabled = false;
  numbersPrompt.innerHTML = '<span class="numbers-prompt-icon">🔊</span><span class="numbers-prompt-hint">Hear it!</span>';
  setPirouette('idle', '⭐');
  numbersRoundLabel.textContent = `${numbersRound + 1} / ${numberSessionLength}`;
  numbersScoreLabel.textContent = String(numbersScore);
  renderNumbersProgress();
  numbersOptions.innerHTML = "";
  resetNumbersFeedback();
  renderTenFrames(round.target);

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
    level: activeBand.id,
    round: numbersRound + 1,
    target: round.target,
    choices: round.choices,
  });
}

const glitterEmojis = ["✨", "⭐", "🌟", "💖", "🌈", "🦄", "🌸", "💫", "🎀", "⭐"];

function spawnGlitter() {
  const stage = document.getElementById("numbersGlitterStage");
  if (!stage) return;
  stage.innerHTML = "";
  for (let i = 0; i < 28; i += 1) {
    const dot = document.createElement("span");
    dot.className = "glitter-dot";
    dot.textContent = glitterEmojis[Math.floor(Math.random() * glitterEmojis.length)];
    dot.style.left = `${5 + Math.random() * 90}%`;
    dot.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 80)}px`);
    dot.style.setProperty("--spin", `${Math.round((Math.random() < 0.5 ? 1 : -1) * (180 + Math.random() * 360))}deg`);
    dot.style.setProperty("--dur", `${Math.round(900 + Math.random() * 800)}ms`);
    dot.style.setProperty("--delay", `${Math.round(Math.random() * 600)}ms`);
    stage.append(dot);
  }
}

function finishNumbers() {
  numbersBoard.hidden = true;
  numbersFinish.hidden = false;
  numbersFinishText.textContent = `Morgan found ${numbersScore} star numbers!`;
  numbersCelebration.classList.remove("is-active");
  spawnGlitter();
  setPirouette('celebrate', 'Magnifique! 🌟');
  const finishCat = document.getElementById('gpFinishCat');
  if (finishCat) finishCat.textContent = getPirouetteEmoji();
  trackEvent({
    type: "session_complete",
    game: "numbers",
    level: activeBand.id,
    score: numbersScore,
    rounds: numberSessionLength,
  });
  NumberAudio.play("ok-magnifique", "Magnifique!");
  playNumbersFinishSound();
  window.setTimeout(() => numbersCelebration.classList.add("is-active"), 120);
}

function nextNumbersRound() {
  numbersBoard.classList.remove("numbers-celebrate", "numbers-shake");
  numbersRound += 1;
  if (numbersRound >= numberSessionLength) {
    finishNumbers();
    return;
  }
  renderNumbersRound();
  speakTarget();
}

const winPhrases = ["ok-magnifique", "ok-bravo", "ok-ohlala"];

function chooseNumber(choice, button) {
  if (numbersAnswered) return;

  const round = numbersRounds[numbersRound];
  const buttons = document.querySelectorAll(".numbers-option");

  if (choice === round.target) {
    trackEvent({
      type: "answer", game: "numbers", level: activeBand.id,
      round: numbersRound + 1, target: round.target, choice, correct: true,
    });
    numbersAnswered = true;
    numbersScore += 1;
    numbersScoreLabel.textContent = String(numbersScore);
    renderNumbersProgress();
    button.classList.add("is-correct");
    numbersFeedback.classList.add("is-correct");
    numbersFeedbackIcon.textContent = "⭐";
    numbersFeedbackText.textContent = `Yes — that's ${round.target}! ⭐`;
    setPirouette('celebrate', 'Magnifique! 🌟');
    numbersBoard.classList.remove("numbers-shake");
    numbersBoard.classList.add("numbers-celebrate");
    numbersPrompt.disabled = true;
    buttons.forEach((item) => { item.disabled = true; });
    // Reinforce the correct number name, then a happy chime.
    NumberAudio.number(round.target);
    playNumbersWinSound();
    window.setTimeout(nextNumbersRound, 1900);
    return;
  }

  trackEvent({
    type: "answer", game: "numbers", level: activeBand.id,
    round: numbersRound + 1, target: round.target, choice, correct: false,
  });
  button.classList.add("is-wrong");
  numbersFeedback.classList.remove("is-correct");
  numbersFeedback.classList.add("is-wrong");
  numbersFeedbackIcon.textContent = "💛";
  numbersFeedbackText.textContent = "Getting warmer! Try again. 💛";
  setPirouette('thinking', 'Getting warmer! 💛');
  NumberAudio.play("try-warmer", "Getting warmer!");
  numbersBoard.classList.remove("numbers-celebrate", "numbers-shake");
  void numbersBoard.offsetWidth;
  numbersBoard.classList.add("numbers-shake");
}

// Pick two distractors from the same band, biased toward near neighbours
// (e.g. 14 & 16 for 15) so the choice is meaningfully hard but in-range.
function pickDistractors(target, band) {
  const pool = rangeNumbers(band).filter((n) => n !== target);
  pool.sort((a, b) => Math.abs(Number(a) - Number(target)) - Math.abs(Number(b) - Number(target)));
  const near = shuffle(pool.slice(0, Math.min(5, pool.length)));
  return near.slice(0, 2);
}

function makeRound(target, band) {
  return { target, choices: shuffle([target, ...pickDistractors(target, band)]) };
}

// Weighted pool — over-indexes (gently) on numbers Morgan has missed before.
function buildWeightedPool(band) {
  const numbers = rangeNumbers(band);
  const events = window.MorganTracker?.read() || [];
  const wrongCounts = {};
  events
    .filter((e) => e.game === "numbers" && e.type === "answer" && !e.correct)
    .forEach((e) => { if (e.target) wrongCounts[e.target] = (wrongCounts[e.target] || 0) + 1; });

  const weighted = [];
  numbers.forEach((number) => {
    const weight = 1 + Math.min(wrongCounts[number] || 0, 2);
    for (let i = 0; i < weight; i += 1) weighted.push(number);
  });
  return weighted;
}

function buildNumbersRounds() {
  const band = activeBand;
  const weighted = buildWeightedPool(band);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const rounds = shuffle(weighted)
      .filter((number, index, arr) => arr.indexOf(number) === index)
      .slice(0, numberSessionLength)
      .map((target) => makeRound(target, band));

    const signature = rounds.map((round) => round.target).join("-");
    if (signature !== lastNumbersSignature) {
      lastNumbersSignature = signature;
      return rounds;
    }
  }

  const fallback = shuffle(rangeNumbers(band))
    .slice(0, numberSessionLength)
    .map((target) => makeRound(target, band));
  lastNumbersSignature = fallback.map((round) => round.target).join("-");
  return fallback;
}

function restartNumbers() {
  numbersRound = 0;
  numbersScore = 0;
  numbersAnswered = false;
  numbersRounds = buildNumbersRounds();
  numbersFinish.hidden = true;
  numbersCelebration.classList.remove("is-active");
  numbersBoard.hidden = false;
  renderNumbersRound();
  speakTarget();
}

function setBand(band) {
  activeBand = band;
  document.querySelectorAll(".numbers-level-chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.band === band.id);
  });
  restartNumbers();
}

function renderBandChips() {
  numbersLevels.innerHTML = "";
  NUMBER_BANDS.forEach((band) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "level-chip numbers-level-chip";
    chip.dataset.band = band.id;
    chip.textContent = band.chip;
    if (band.id === activeBand.id) chip.classList.add("is-active");
    chip.addEventListener("click", () => setBand(band));
    numbersLevels.append(chip);
  });
}

numbersPrompt.addEventListener("click", speakTarget);
numbersPlayAgainButton.addEventListener("click", restartNumbers);

renderBandChips();
numbersRounds = buildNumbersRounds();

const gpCatInit = document.getElementById('gpCat');
if (gpCatInit) gpCatInit.textContent = getPirouetteEmoji();
const gpFinishCatInit = document.getElementById('gpFinishCat');
if (gpFinishCatInit) gpFinishCatInit.textContent = getPirouetteEmoji();

renderNumbersRound();
speakWhenReady();
setPirouette('idle', 'Find the number! ⭐');
