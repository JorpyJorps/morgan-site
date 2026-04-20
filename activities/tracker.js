// ── Shared voice utility ──────────────────────────────────────────────────────
// Prefers iOS Enhanced voices (e.g. "Samantha (Enhanced)"), warm macOS voices,
// then Google/Edge high-quality voices. Uses partial matching so names that
// vary by platform/settings are still caught.
(function () {
  if (!("speechSynthesis" in window)) return;

  let _best = null;

  function findBest() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const n = (v) => v.name.toLowerCase();
    const isEn = (v) => v.lang.toLowerCase().startsWith("en");
    // 1. Any English Enhanced voice (iOS Samantha/Siri downloaded as Enhanced)
    const enhanced = voices.find((v) => isEn(v) && n(v).includes("enhanced"));
    if (enhanced) return enhanced;
    // 2. Samantha — iOS / macOS default (partial catches "Samantha (Enhanced)" too)
    const samantha = voices.find((v) => n(v).includes("samantha"));
    if (samantha) return samantha;
    // 3. Other warm local voices
    for (const w of ["karen", "moira", "tessa", "serena"]) {
      const m = voices.find((v) => n(v).includes(w));
      if (m) return m;
    }
    // 4. Quality cloud voices
    for (const c of ["google us english", "microsoft aria online", "microsoft jenny online", "microsoft aria", "microsoft zira"]) {
      const m = voices.find((v) => n(v).includes(c));
      if (m) return m;
    }
    // 5. Any local en-US, then any en-US, then first
    return voices.find((v) => v.lang === "en-US" && v.localService)
      || voices.find((v) => v.lang === "en-US")
      || voices[0]
      || null;
  }

  // Reset cache when Chrome's async voice list loads
  window.speechSynthesis.addEventListener("voiceschanged", () => { _best = null; });

  window.MorganVoice = {
    getBest() {
      if (!_best) _best = findBest();
      return _best;
    },
    speak(text, { rate = 0.88, pitch = 1.12, volume = 1 } = {}) {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = rate;
      utt.pitch = pitch;
      utt.volume = volume;
      const v = this.getBest();
      if (v) utt.voice = v;
      window.speechSynthesis.speak(utt);
    },
    // Waits for Chrome's async voice list before speaking
    speakWhenReady(text, opts) {
      if (!("speechSynthesis" in window)) return;
      if (window.speechSynthesis.getVoices().length > 0) {
        this.speak(text, opts);
      } else {
        window.speechSynthesis.addEventListener("voiceschanged", () => this.speak(text, opts), { once: true });
      }
    },
  };
}());

// ─────────────────────────────────────────────────────────────────────────────
const MORGAN_TRACKER_KEY = "morgan_magic_garden_tracker_v1";

function getTrackerStore() {
  try {
    const raw = window.localStorage.getItem(MORGAN_TRACKER_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTrackerStore(events) {
  try {
    window.localStorage.setItem(MORGAN_TRACKER_KEY, JSON.stringify(events));
  } catch (error) {
    // Ignore storage errors so the games never break.
  }
}

window.MorganTracker = {
  log(event) {
    if (!event || typeof event !== "object") {
      return;
    }

    const events = getTrackerStore();
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    if (events.length > 500) {
      events.splice(0, events.length - 500);
    }

    saveTrackerStore(events);
  },

  read() {
    return getTrackerStore();
  },

  clear() {
    saveTrackerStore([]);
  },
};
