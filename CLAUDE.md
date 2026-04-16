# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

```bash
npm install       # first time only
npm run dev       # serves on port 3001 (auto-picks another if busy)
```

No build step. Pure static HTML/CSS/JS served directly by `serve`.

## Architecture

**Homepage hub** (`index.html`) links to all activity pages. `script.js` adds button press animations and the sparkle cursor trail on the home page only (guarded by `page-home` body class).

**Activity pages** live in `activities/`. Each activity is a self-contained pair: `activities/<name>.html` + `activities/<name>.js`. They share `styles.css` for the visual theme but own all their game logic locally.

**Progress tracking** flows through `activities/tracker.js`, which exposes `window.MorganTracker` — a thin localStorage wrapper keyed to `morgan_magic_garden_tracker_v1`. Activity scripts call `MorganTracker.log({ type, game, ... })` with two event shapes:
- `type: "answer"` — per-question result with `target`, `choice`, `correct`
- `type: "session_complete"` — end-of-game summary with `score`, `rounds`, `game`, `level`, `theme`

**Sticker Garden** (`activities/sticker-garden.js`) reads `session_complete` events to determine how many stickers are unlocked (one per completed session, up to 12). Placements are saved separately under `morgan_magic_garden_sticker_garden_v1`.

**Parent Review / Progress Garden** (`activities/parent-review.html` + `activities/progress-garden.js`) reads all tracker events and surfaces missed letters, confusion pairs, and recent sessions. It has Refresh and Clear buttons; no authentication gate yet.

## Conventions

- Each activity's JS is loaded via a `<script src="...">` tag at the bottom of its HTML. `tracker.js` must load before any activity script that calls `MorganTracker`.
- `styles.css` owns all shared design tokens and layout. Activity pages add a `page-<name>` class to `<body>` for page-specific overrides.
- No framework, no bundler, no TypeScript. Keep new activity scripts in the same plain-JS style.
