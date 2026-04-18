const CACHE = 'morgan-garden-v3';

const PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/activities/letters.html',
  '/activities/letters.js',
  '/activities/numbers.html',
  '/activities/numbers.js',
  '/activities/shapes.html',
  '/activities/shapes.js',
  '/activities/patterns.html',
  '/activities/patterns.js',
  '/activities/memory-match.html',
  '/activities/memory-match.js',
  '/activities/puzzles.html',
  '/activities/puzzles.js',
  '/activities/art-studio.html',
  '/activities/art-studio.js',
  '/activities/sticker-garden.html',
  '/activities/sticker-garden.js',
  '/activities/tracker.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first — always try live, fall back to cache if offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
