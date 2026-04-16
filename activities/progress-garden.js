const summarySessions = document.querySelector("#summary-sessions");
const summaryGames = document.querySelector("#summary-games");
const summaryLetters = document.querySelector("#summary-letters");
const lettersPracticeList = document.querySelector("#letters-practice-list");
const confusionPairsList = document.querySelector("#confusion-pairs-list");
const recentSessionsList = document.querySelector("#recent-sessions-list");
const progressRefreshButton = document.querySelector("#progress-refresh-button");
const progressClearButton = document.querySelector("#progress-clear-button");

function getTrackedEvents() {
  if (!window.MorganTracker?.read) {
    return [];
  }

  return window.MorganTracker.read();
}

function formatGameName(game) {
  const names = {
    letters: "Letters",
    numbers: "Numbers",
    shapes: "Shapes",
    patterns: "Patterns",
    "memory-match": "Memory Match",
    puzzles: "Puzzles",
  };

  return names[game] || game || "Game";
}

function createEmptyState(message) {
  const item = document.createElement("div");
  item.className = "progress-empty";
  item.textContent = message;
  return item;
}

function renderLetterPractice(answerEvents) {
  lettersPracticeList.innerHTML = "";

  const missesByTarget = new Map();

  answerEvents
    .filter((event) => event.game === "letters" && event.correct === false && event.target)
    .forEach((event) => {
      missesByTarget.set(event.target, (missesByTarget.get(event.target) || 0) + 1);
    });

  const topLetters = [...missesByTarget.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  if (!topLetters.length) {
    lettersPracticeList.append(createEmptyState("No missed letters yet."));
    summaryLetters.textContent = "None yet";
    return;
  }

  summaryLetters.textContent = topLetters
    .slice(0, 3)
    .map(([letter]) => letter)
    .join(", ");

  topLetters.forEach(([letter, misses]) => {
    const chip = document.createElement("div");
    chip.className = "progress-stat-chip";
    chip.innerHTML = `<strong>${letter}</strong><span>${misses} miss${misses === 1 ? "" : "es"}</span>`;
    lettersPracticeList.append(chip);
  });
}

function renderConfusionPairs(answerEvents) {
  confusionPairsList.innerHTML = "";

  const confusionMap = new Map();

  answerEvents
    .filter((event) => event.game === "letters" && event.correct === false && event.target && event.choice)
    .forEach((event) => {
      const pair = `${event.target} → ${event.choice}`;
      confusionMap.set(pair, (confusionMap.get(pair) || 0) + 1);
    });

  const topPairs = [...confusionMap.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  if (!topPairs.length) {
    confusionPairsList.append(createEmptyState("No repeating mix-ups yet."));
    return;
  }

  topPairs.forEach(([pair, count]) => {
    const chip = document.createElement("div");
    chip.className = "progress-stat-chip";
    chip.innerHTML = `<strong>${pair}</strong><span>${count} time${count === 1 ? "" : "s"}</span>`;
    confusionPairsList.append(chip);
  });
}

function describeSession(event) {
  if (event.game === "letters") {
    return `${event.score || 0} of ${event.rounds || 0} letters`;
  }

  if (event.game === "numbers") {
    return `${event.score || 0} of ${event.rounds || 0} numbers`;
  }

  if (event.game === "shapes") {
    return `${event.score || 0} of ${event.rounds || 0} shapes`;
  }

  if (event.game === "patterns") {
    return `${event.score || 0} of ${event.rounds || 0} patterns`;
  }

  if (event.game === "memory-match") {
    return `${event.matches || 0} matches in ${event.turns || 0} turns`;
  }

  if (event.game === "puzzles") {
    return `${event.score || 0} of ${event.rounds || 0} pictures`;
  }

  return "Session finished";
}

function renderRecentSessions(sessionEvents) {
  recentSessionsList.innerHTML = "";

  const recent = [...sessionEvents]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 8);

  if (!recent.length) {
    recentSessionsList.append(createEmptyState("No finished sessions yet."));
    return;
  }

  recent.forEach((event) => {
    const item = document.createElement("article");
    item.className = "progress-session-card";

    const when = new Date(event.timestamp);
    const level = event.level === "level2" ? "Level 2" : "Level 1";
    const subtitleBits = [level];

    if (event.theme) {
      subtitleBits.push(event.theme === "morgan" ? "Morgan Mix" : `${event.theme[0].toUpperCase()}${event.theme.slice(1)}`);
    }

    item.innerHTML = `
      <div class="progress-session-top">
        <strong>${formatGameName(event.game)}</strong>
        <span>${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
      </div>
      <div class="progress-session-middle">${subtitleBits.join(" • ")}</div>
      <div class="progress-session-bottom">${describeSession(event)}</div>
    `;

    recentSessionsList.append(item);
  });
}

function renderSummary(events, sessionEvents) {
  summarySessions.textContent = String(sessionEvents.length);
  summaryGames.textContent = String(new Set(events.map((event) => event.game).filter(Boolean)).size);
}

function renderProgressGarden() {
  const events = getTrackedEvents();
  const answerEvents = events.filter((event) => event.type === "answer");
  const sessionEvents = events.filter((event) => event.type === "session_complete");

  renderSummary(events, sessionEvents);
  renderLetterPractice(answerEvents);
  renderConfusionPairs(answerEvents);
  renderRecentSessions(sessionEvents);
}

progressRefreshButton.addEventListener("click", renderProgressGarden);
progressClearButton.addEventListener("click", () => {
  if (window.MorganTracker?.clear) {
    window.MorganTracker.clear();
  }

  renderProgressGarden();
});

renderProgressGarden();
