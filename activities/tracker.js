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
