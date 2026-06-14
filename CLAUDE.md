# CLAUDE.md

Morgan's Magic Garden — learning app for Morgan (age 5, speech delay, starting kindergarten).
Built by her dad. Deployed at https://morgan-site.vercel.app via GitHub → Vercel auto-deploy.

## Running locally

```bash
npm install       # first time only
npm run dev       # serves on port 3001
```

No build step. Pure static HTML/CSS/JS via `serve`. No framework, no bundler, no TypeScript.

## Architecture

**Hub:** `index.html` → links all activity pages. `script.js` handles button animations + sparkle cursor (home only, guarded by `.page-home`).

**Activities:** `activities/<name>.html` + `activities/<name>.js` — fully self-contained pairs. All share `styles.css` for design tokens and layout.

**tracker.js** — loads before every activity script. Exposes:
- `window.MorganTracker` — localStorage wrapper (`morgan_magic_garden_tracker_v1`)
  - `.log({ type, game, ... })` — `type: "answer"` or `type: "session_complete"`
- `window.MorganVoice` — shared voice utility
  - `.speak(text, { rate, pitch, volume })` — picks best iOS/macOS/Chrome voice
  - `.speakWhenReady(text, opts)` — same but waits for Chrome's async voice list
  - Voice priority: Enhanced (iOS downloaded) → Samantha → Karen/Moira → Google US English → Microsoft Aria → fallback
  - Uses partial name matching so "Samantha (Enhanced)" is caught on iOS

**Service Worker:** `sw.js` — network-first, cache fallback. Currently `morgan-garden-v5`. Bump version to force fresh files on devices. Precaches the voice clips in `/assets/audio/` (install uses `Promise.allSettled` so a missing file won't abort).

**Voice (pre-recorded):** `scripts/generate-voice.sh` generates Pirouette's clips into `/assets/audio/*.m4a` using the macOS `say` voice (default `Samantha`) + `afconvert`. Free, offline, no accounts. Re-run anytime; upgrade path is to swap `say` for OpenAI TTS / ElevenLabs keeping the same filenames. Numbers uses a local `NumberAudio` helper that plays `num-<n>.m4a` and **falls back to `MorganVoice` (Web Speech)** if a clip is missing/blocked, so audio never fully breaks. (Voice not yet rolled to other games — that's Tier 2.)

**Sticker Garden:** reads `session_complete` events — 1 sticker per completed session, up to 12. Placements saved under `morgan_magic_garden_sticker_garden_v1`.

**Parent Review:** `activities/parent-review.html` + `activities/progress-garden.js` — reads tracker, shows missed letters/confusion pairs. Has "Reset Pirouette" button.

## Pirouette — the mascot

- Cat 🐱 or Penguin 🐧 (Morgan chooses on first launch)
- Saved in `localStorage` under `morgan_pirouette_animal_v1`
- Met-flag: `morgan_pirouette_met_v1`
- Helper: `getPirouetteEmoji()` reads localStorage and returns correct emoji
- In-game Pirouette uses `.game-pirouette` + `.gp-cat` + `.gp-bubble` elements and state classes like `.gp-excited`, `.gp-sad` etc.
- Home page has animated pirouette scene with bubble ("Bonjour! 🌸")
- First-launch overlay: 2-step flow (meet → pick animal) then instant dismiss

## Activity status

| Activity | File | Status |
|---|---|---|
| Letters | letters.html / letters.js | ✅ Fully rebuilt — Pirouette, SVG rainbow celebration, glitter, voice |
| Numbers | numbers.html / numbers.js | ✅ Rebuilt — Pirouette, **ten-frames** for teen numbers (11–20), config-driven number bands, pre-recorded voice, rainbow+glitter celebration |
| Patterns | patterns.html / patterns.js | ⚠️ Functional — Level 1 + 2, mobile fixed, needs Pirouette + Level 3 |
| Shapes | shapes.html / shapes.js | ⚠️ Functional but old-style — no Pirouette, needs rebuild |
| Memory Match | memory-match.html / memory-match.js | ⚠️ Functional, old celebration style |
| Art Studio | art-studio.html / art-studio.js | ✅ Mobile overhauled — canvas first, scrollable tool strips, flip button, landscape layout |
| Puzzles | puzzles.html / puzzles.js | ⚠️ Functional, placeholder quality |
| Sticker Garden | sticker-garden.html / sticker-garden.js | ✅ Working |
| Colors | colors.html | ❌ Placeholder only |
| French Café | french-cafe.html | ❌ Not built yet |
| Parent Review | parent-review.html / progress-garden.js | ✅ Working, has Reset Pirouette |

## Design system (styles.css)

- Design tokens: `--purple`, `--pink`, `--yellow`, `--ink-strong`, `--shadow`, etc.
- Page themes via body class: `theme-page-fairy`, `theme-page-unicorn`, `theme-page-rainbow`, `theme-page-bunny`, `theme-page-butterfly`, `theme-page-art`, `theme-page-puzzle`, `theme-page-stickers`
- Shared components: `.activity-banner`, `.activity-shell`, `.button` (primary/secondary), `.level-chip`, `.nav-chip`, `.top-nav`
- Mobile breakpoints: 720px (main), 600px, 640px
- Landscape phone: `@media (orientation: landscape) and (max-height: 560px)` — used by Art Studio
- Cursor sparkle trail + wand: home page only, scoped to `@media (hover: hover) and (pointer: fine)`

## CSS specificity rule (important!)

`.mp-step[hidden] { display: none !important; }` — required because `.mp-step { display: flex }` would otherwise override `[hidden]`'s `display: none` at equal specificity.

## Mobile conventions

- Touch targets: min 44×44px
- `touch-action: manipulation` on interactive elements to remove 300ms iOS delay
- `-webkit-tap-highlight-color: transparent` on buttons
- Art Studio: `canvas.setPointerCapture(event.pointerId)` so strokes don't break at edge
- Pattern row: `display: flex; flex-wrap: nowrap` so sequence stays one row on mobile
- All Art Studio tool strips: `flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none`

## Number bands — how Numbers grows (no rebuild needed)

`numbers.js` drives the whole game from a `NUMBER_BANDS` config array at the top:
`{ id, chip, range: [lo, hi] }`. Each band becomes a chip and uses ten-frames.
**Adding 21–30, 31–40 … is a one-line config change.** Kindergarten target nuance:
kids *count* to 100 (by ones and tens) but only *read/write numerals* to 20 — so
numeral-recognition bands stay in 0–20; "to 100" should later be a separate
count-by-tens / hundred-chart mode, not more recognition bands.

## Backlog (priority order — refreshed summer 2026)

**Tier 1 — teen numbers (DONE):** ten-frame engine + bands + pre-recorded voice. ✅

**Tier 2 — character + design glow-up (next):**
1. **One illustrated Pirouette** — commit to a single character (French cat vibe; base on a photo of Morgan's stuffed animal per the bible). Generate via OpenAI image gen: flat vector, transparent bg, 4–5 poses (idle/happy, thinking, celebrating, confused). Drop PNGs in `assets/`, swap the emoji usage. **This replaces the cat-or-penguin choice.**
2. **Roll pre-recorded voice across the app** — promote `NumberAudio` into a shared helper in `tracker.js`; record letters + letter-sounds + phrases.
3. **Design polish pass** — consistent type/spacing, real illustrated touches per world.

**Tier 3 — breadth + reward world:**
4. **Rebuild Shapes** (Pirouette, match Letters/Numbers quality)
5. **Build Colors** (currently placeholder)
6. **Letter sounds / phonics (Letters Level 3)** — "find the letter that says /b/" — now feasible with pre-recorded clips
7. **Patterns Level 3** — ABCABC, harder distractors
8. **French Café world** + **Pirouette outfit unlocks**

**Other observations to address:**
- Home grid links to unbuilt pages (Colors, French Café, Build It/Puzzles) → dead ends for a solo 5-yo. Lock/"coming soon" them until built.
- Parent Review should surface teen-number confusions (it already tracks misses).

## Key decisions made

- **Voice:** Moving to **pre-recorded clips** (see Voice section above) for core words — best for a speech-delay learner. Numbers already uses them; `MorganVoice` (Web Speech) stays as the automatic fallback. First-pass clips use macOS `say` (Samantha); can upgrade to OpenAI TTS / ElevenLabs later with the same filenames.
- **No animations gating UI:** Never use `animationend` as the sole trigger to dismiss/show critical elements on mobile — fires unreliably. Use direct DOM state changes.
- **French Café scope:** Learning game (listen + match French words to pictures) + hangout/reward zone. Vocabulary: colors, numbers 1–20, foods, animals, greetings.
- **Outfit unlocks:** Earned from any game (not just Café), applied to Pirouette in Café.
- **Decoration philosophy:** Intentional theming only — no random ✦ ✧ sparkle characters floating in game boards. Each world has its own emoji theme.

## Git worktree note

Preview server runs from `.claude/worktrees/hardcore-antonelli/`. After committing to main, sync the worktree:
```bash
cd /Users/Jorpy/Desktop/code/morgan-site/.claude/worktrees/hardcore-antonelli && git merge main --no-edit
```
