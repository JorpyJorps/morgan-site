const boardSize = 3;
const puzzleRounds = [
  {
    label: "Magic Unicorn",
    imagePath: "/assets/reward-images/magic-unicorn.png",
    missingCell: 4,
    choiceCells: [4, 1, 8],
  },
  {
    label: "Kitty Magic",
    imagePath: "/assets/reward-images/kitty-magic.png",
    missingCell: 6,
    choiceCells: [6, 2, 4],
  },
  {
    label: "Bunny Garden",
    imagePath: "/assets/reward-images/bunny.png",
    missingCell: 2,
    choiceCells: [2, 5, 7],
  },
  {
    label: "Magic Unicorn",
    imagePath: "/assets/reward-images/magic-unicorn.png",
    missingCell: 7,
    choiceCells: [7, 3, 0],
  },
  {
    label: "Kitty Magic",
    imagePath: "/assets/reward-images/kitty-magic.png",
    missingCell: 0,
    choiceCells: [0, 4, 8],
  },
  {
    label: "Bunny Garden",
    imagePath: "/assets/reward-images/bunny.png",
    missingCell: 5,
    choiceCells: [5, 1, 3],
  },
];

const puzzleBoard = document.querySelector("#puzzle-board");
const puzzleOptions = document.querySelector("#puzzle-options");
const puzzleRoundLabel = document.querySelector("#puzzle-round-label");
const puzzleScoreLabel = document.querySelector("#puzzle-score-label");
const puzzleFeedback = document.querySelector("#puzzle-feedback");
const puzzleFeedbackIcon = document.querySelector("#puzzle-feedback-icon");
const puzzleFeedbackText = document.querySelector("#puzzle-feedback-text");
const puzzleSceneLabel = document.querySelector("#puzzle-scene-label");
const puzzleFinish = document.querySelector("#puzzle-finish");
const puzzleFinishText = document.querySelector("#puzzle-finish-text");
const puzzleBoardShell = document.querySelector(".puzzle-board-shell");
const puzzlePlayAgainButton = document.querySelector("#puzzle-play-again-button");

let orderedPuzzleRounds = [];
let puzzleRoundIndex = 0;
let puzzleScore = 0;
let puzzleAnswered = false;
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

function playPuzzleWinSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  playTone(523.25, start, 0.14, 0.08);
  playTone(783.99, start + 0.08, 0.18, 0.07);
}

function playPuzzleFinishSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const start = context.currentTime;
  [523.25, 659.25, 783.99, 987.77].forEach((frequency, index) => {
    playTone(frequency, start + index * 0.12, 0.24, 0.08);
  });
}

function getCellPosition(cellIndex) {
  const row = Math.floor(cellIndex / boardSize);
  const col = cellIndex % boardSize;
  return { row, col };
}

function getEdgeType(row, col, direction) {
  if (direction === "top") {
    if (row === 0) return "flat";
    return (row + col) % 2 === 0 ? "slot" : "tab";
  }
  if (direction === "right") {
    if (col === boardSize - 1) return "flat";
    return row % 2 === 0 ? "tab" : "slot";
  }
  if (direction === "bottom") {
    if (row === boardSize - 1) return "flat";
    return (row + col) % 2 === 0 ? "tab" : "slot";
  }
  if (col === 0) return "flat";
  return row % 2 === 0 ? "slot" : "tab";
}

function buildPuzzleClipPath(row, col) {
  const top = getEdgeType(row, col, "top");
  const right = getEdgeType(row, col, "right");
  const bottom = getEdgeType(row, col, "bottom");
  const left = getEdgeType(row, col, "left");
  const knob = 14;

  const topY = top === "tab" ? knob : 0;
  const rightX = right === "tab" ? 100 - knob : 100;
  const bottomY = bottom === "tab" ? 100 - knob : 100;
  const leftX = left === "tab" ? knob : 0;

  const d = [];
  d.push(`M ${leftX} ${topY}`);

  d.push(`L 34 ${topY}`);
  if (top === "tab") {
    d.push(`Q 40 0 50 0`);
    d.push(`Q 60 0 66 ${topY}`);
  } else if (top === "slot") {
    d.push(`Q 40 ${topY + knob} 50 ${topY + knob}`);
    d.push(`Q 60 ${topY + knob} 66 ${topY}`);
  }
  d.push(`L ${rightX} ${topY}`);

  d.push(`L ${rightX} 34`);
  if (right === "tab") {
    d.push(`Q 100 40 100 50`);
    d.push(`Q 100 60 ${rightX} 66`);
  } else if (right === "slot") {
    d.push(`Q ${rightX - knob} 40 ${rightX - knob} 50`);
    d.push(`Q ${rightX - knob} 60 ${rightX} 66`);
  }
  d.push(`L ${rightX} ${bottomY}`);

  d.push(`L 66 ${bottomY}`);
  if (bottom === "tab") {
    d.push(`Q 60 100 50 100`);
    d.push(`Q 40 100 34 ${bottomY}`);
  } else if (bottom === "slot") {
    d.push(`Q 60 ${bottomY - knob} 50 ${bottomY - knob}`);
    d.push(`Q 40 ${bottomY - knob} 34 ${bottomY}`);
  }
  d.push(`L ${leftX} ${bottomY}`);

  d.push(`L ${leftX} 66`);
  if (left === "tab") {
    d.push(`Q 0 60 0 50`);
    d.push(`Q 0 40 ${leftX} 34`);
  } else if (left === "slot") {
    d.push(`Q ${leftX + knob} 60 ${leftX + knob} 50`);
    d.push(`Q ${leftX + knob} 40 ${leftX} 34`);
  }
  d.push("Z");

  return `path("${d.join(" ")}")`;
}

function createImagePiece(round, cellIndex, { missing = false, small = false } = {}) {
  const { row, col } = getCellPosition(cellIndex);
  const piece = document.createElement("div");
  piece.className = small ? "puzzle-piece puzzle-piece-small" : "puzzle-piece";
  const clipPath = buildPuzzleClipPath(row, col);
  piece.style.clipPath = clipPath;
  piece.style.webkitClipPath = clipPath;

  const viewport = document.createElement("div");
  viewport.className = missing ? "puzzle-piece-viewport puzzle-piece-viewport-missing" : "puzzle-piece-viewport";
  viewport.style.clipPath = clipPath;
  viewport.style.webkitClipPath = clipPath;

  const art = document.createElement("div");
  art.className = "puzzle-piece-art";
  art.style.backgroundImage = `url("${round.imagePath}")`;
  art.style.transform = `translate(${-33.333333 * col}%, ${-33.333333 * row}%)`;
  viewport.append(art);
  piece.append(viewport);

  if (missing) {
    piece.classList.add("puzzle-piece-missing");
    const mark = document.createElement("span");
    mark.className = "puzzle-missing-mark";
    mark.textContent = "?";
    piece.append(mark);
  }

  return piece;
}

function resetPuzzleFeedback() {
  puzzleFeedback.classList.remove("is-correct", "is-wrong");
  puzzleFeedbackIcon.textContent = "✨";
  puzzleFeedbackText.textContent = "Pick the piece that fits.";
}

function renderPuzzleRound() {
  const round = orderedPuzzleRounds[puzzleRoundIndex];
  const choices = shuffle(round.choiceCells.map((cellIndex) => ({ cellIndex })));

  puzzleAnswered = false;
  puzzleBoard.innerHTML = "";
  puzzleOptions.innerHTML = "";
  puzzleSceneLabel.textContent = round.label;
  puzzleRoundLabel.textContent = `${puzzleRoundIndex + 1} / ${orderedPuzzleRounds.length}`;
  puzzleScoreLabel.textContent = String(puzzleScore);
  resetPuzzleFeedback();
  puzzleBoardShell.classList.remove("puzzle-celebrate", "puzzle-shake");

  Array.from({ length: boardSize * boardSize }).forEach((_, cellIndex) => {
    const cell = document.createElement("div");
    cell.className = "puzzle-board-cell";
    cell.append(createImagePiece(round, cellIndex, { missing: cellIndex === round.missingCell }));
    puzzleBoard.append(cell);
  });

  choices.forEach(({ cellIndex }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "puzzle-option";
    button.setAttribute("aria-label", "Choose puzzle piece");
    button.append(createImagePiece(round, cellIndex, { small: true }));
    button.addEventListener("click", () => choosePuzzlePiece(round, cellIndex, button));
    puzzleOptions.append(button);
  });

  trackEvent({
    type: "prompt",
    game: "puzzles",
    round: puzzleRoundIndex + 1,
    target: round.missingCell,
    label: round.label,
    choices: round.choiceCells,
  });
}

function finishPuzzles() {
  puzzleBoardShell.hidden = true;
  puzzleFinish.hidden = false;
  puzzleFinishText.textContent = `Morgan fixed ${puzzleScore} picture puzzles!`;
  trackEvent({
    type: "session_complete",
    game: "puzzles",
    score: puzzleScore,
    rounds: orderedPuzzleRounds.length,
  });
  playPuzzleFinishSound();
}

function nextPuzzleRound() {
  puzzleRoundIndex += 1;
  if (puzzleRoundIndex >= orderedPuzzleRounds.length) {
    finishPuzzles();
    return;
  }
  renderPuzzleRound();
}

function choosePuzzlePiece(round, cellIndex, button) {
  if (puzzleAnswered) {
    return;
  }

  const optionButtons = document.querySelectorAll(".puzzle-option");

  if (cellIndex === round.missingCell) {
    puzzleAnswered = true;
    puzzleScore += 1;
    puzzleScoreLabel.textContent = String(puzzleScore);
    button.classList.add("is-correct");
    puzzleFeedback.classList.add("is-correct");
    puzzleFeedbackIcon.textContent = "🧩";
    puzzleFeedbackText.textContent = "That piece fits!";
    puzzleBoardShell.classList.add("puzzle-celebrate");

    const missingPiece = puzzleBoard.querySelector(".puzzle-piece-missing");
    if (missingPiece) {
      missingPiece.replaceWith(createImagePiece(round, round.missingCell));
    }

    optionButtons.forEach((item) => {
      item.disabled = true;
    });

    trackEvent({
      type: "answer",
      game: "puzzles",
      round: puzzleRoundIndex + 1,
      target: round.missingCell,
      choice: cellIndex,
      correct: true,
    });

    playPuzzleWinSound();
    window.setTimeout(nextPuzzleRound, 1600);
    return;
  }

  button.classList.add("is-wrong");
  puzzleFeedback.classList.remove("is-correct");
  puzzleFeedback.classList.add("is-wrong");
  puzzleFeedbackIcon.textContent = "💫";
  puzzleFeedbackText.textContent = "Try another piece.";
  puzzleBoardShell.classList.remove("puzzle-celebrate", "puzzle-shake");
  void puzzleBoardShell.offsetWidth;
  puzzleBoardShell.classList.add("puzzle-shake");

  trackEvent({
    type: "answer",
    game: "puzzles",
    round: puzzleRoundIndex + 1,
    target: round.missingCell,
    choice: cellIndex,
    correct: false,
  });
}

function restartPuzzles() {
  orderedPuzzleRounds = shuffle(puzzleRounds);
  puzzleRoundIndex = 0;
  puzzleScore = 0;
  puzzleAnswered = false;
  puzzleFinish.hidden = true;
  puzzleBoardShell.hidden = false;
  renderPuzzleRound();
}

puzzlePlayAgainButton.addEventListener("click", restartPuzzles);

restartPuzzles();
