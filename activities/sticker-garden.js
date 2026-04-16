const stickerStorageKey = "morgan_magic_garden_sticker_garden_v1";
const stickerStarCount = document.querySelector("#sticker-star-count");
const stickerUnlockedCount = document.querySelector("#sticker-unlocked-count");
const stickerPicker = document.querySelector("#sticker-picker");
const stickerSessionList = document.querySelector("#sticker-session-list");
const stickerResetButton = document.querySelector("#sticker-reset-button");
const gardenSlots = document.querySelectorAll(".garden-slot");

const stickerCatalog = [
  { id: "rainbow", icon: "🌈" },
  { id: "unicorn", icon: "🦄" },
  { id: "kitty", icon: "🐱" },
  { id: "flower", icon: "🌸" },
  { id: "star", icon: "⭐" },
  { id: "heart", icon: "💖" },
  { id: "donut", icon: "🍩" },
  { id: "butterfly", icon: "🦋" },
  { id: "bunny", icon: "🐰" },
  { id: "fairy", icon: "🧚" },
  { id: "cupcake", icon: "🧁" },
  { id: "soccer", icon: "⚽" },
];

let selectedStickerId = null;

function readStickerState() {
  try {
    const raw = window.localStorage.getItem(stickerStorageKey);
    if (!raw) {
      return { placements: {} };
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { placements: {} };
  } catch (error) {
    return { placements: {} };
  }
}

function saveStickerState(state) {
  try {
    window.localStorage.setItem(stickerStorageKey, JSON.stringify(state));
  } catch (error) {
    // Ignore storage failures so the page still works.
  }
}

function getSessionEvents() {
  if (!window.MorganTracker?.read) {
    return [];
  }

  return window.MorganTracker.read().filter((event) => event.type === "session_complete");
}

function getUnlockedStickers(events) {
  const count = Math.min(stickerCatalog.length, events.length);
  return stickerCatalog.slice(0, count);
}

function formatGameName(game) {
  const names = {
    letters: "Letters",
    patterns: "Patterns",
    "memory-match": "Memory Match",
    puzzles: "Puzzles",
  };

  return names[game] || "Game";
}

function renderStickerPicker(unlockedStickers) {
  stickerPicker.innerHTML = "";

  if (!unlockedStickers.length) {
    const empty = document.createElement("div");
    empty.className = "sticker-empty";
    empty.textContent = "Play a game to unlock your first sticker.";
    stickerPicker.append(empty);
    selectedStickerId = null;
    return;
  }

  if (!selectedStickerId || !unlockedStickers.some((sticker) => sticker.id === selectedStickerId)) {
    selectedStickerId = unlockedStickers[0].id;
  }

  unlockedStickers.forEach((sticker) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = sticker.id === selectedStickerId ? "sticker-choice is-active" : "sticker-choice";
    button.dataset.stickerId = sticker.id;
    button.textContent = sticker.icon;
    button.setAttribute("aria-label", `Choose sticker ${sticker.id}`);
    button.addEventListener("click", () => {
      selectedStickerId = sticker.id;
      renderStickerPicker(unlockedStickers);
    });
    stickerPicker.append(button);
  });
}

function renderGarden(unlockedStickers) {
  const state = readStickerState();

  gardenSlots.forEach((slot) => {
    const stickerId = state.placements[slot.dataset.slot];
    const sticker = unlockedStickers.find((item) => item.id === stickerId);
    slot.textContent = sticker ? sticker.icon : "✨";
    slot.classList.toggle("has-sticker", Boolean(sticker));
  });
}

function renderRecentSessions(events) {
  stickerSessionList.innerHTML = "";
  const recent = [...events]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 5);

  if (!recent.length) {
    const empty = document.createElement("div");
    empty.className = "sticker-empty";
    empty.textContent = "Little wins will show up here.";
    stickerSessionList.append(empty);
    return;
  }

  recent.forEach((event) => {
    const item = document.createElement("div");
    item.className = "sticker-session-item";
    item.innerHTML = `<strong>${formatGameName(event.game)}</strong><span>${event.score || event.matches || 0}</span>`;
    stickerSessionList.append(item);
  });
}

function renderStickerGarden() {
  const events = getSessionEvents();
  const unlockedStickers = getUnlockedStickers(events);

  stickerStarCount.textContent = String(events.length);
  stickerUnlockedCount.textContent = String(unlockedStickers.length);
  renderStickerPicker(unlockedStickers);
  renderGarden(unlockedStickers);
  renderRecentSessions(events);
}

gardenSlots.forEach((slot) => {
  slot.addEventListener("click", () => {
    if (!selectedStickerId) {
      return;
    }

    const state = readStickerState();
    state.placements[slot.dataset.slot] = selectedStickerId;
    saveStickerState(state);
    renderStickerGarden();
  });
});

stickerResetButton.addEventListener("click", () => {
  saveStickerState({ placements: {} });
  renderStickerGarden();
});

renderStickerGarden();
