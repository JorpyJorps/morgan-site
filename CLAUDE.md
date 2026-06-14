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

**Service Worker:** `sw.js` — network-first, cache fallback. Currently `morgan-garden-v4`. Bump version to force fresh files on devices.

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
| Numbers | numbers.html / numbers.js | ⚠️ Functional but old-style — no Pirouette, needs rebuild |
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

## Backlog (priority order)

1. **Rebuild Numbers game** — Pirouette, better UX, match Letters quality
2. **Rebuild Shapes game** — same
3. **Patterns Level 3** — ABCABC sequences, harder distractors
4. **Letter sounds / phonics (Level 3)** — "find the letter that says /b/" — needs voice strategy
5. **French Café world** — hangout/reward zone + match French words to pictures (colors, numbers 1–20, foods, animals, greetings) — Pirouette's home base
6. **Pirouette outfit unlocks** — earned from any game, applied in French Café
7. **Colors game** — currently placeholder
8. **Voice: pre-recorded MP3s** — ElevenLabs or macOS `say` command, one-time generation, best quality for letter sounds + French

## Key decisions made

- **Voice:** Using Web Speech API with `MorganVoice` in tracker.js for best iOS voice selection. On iPhone: Settings → Accessibility → Spoken Content → Voices → English → download "Samantha (Enhanced)" for best results. Pre-recorded MP3s parked for later.
- **No animations gating UI:** Never use `animationend` as the sole trigger to dismiss/show critical elements on mobile — fires unreliably. Use direct DOM state changes.
- **French Café scope:** Learning game (listen + match French words to pictures) + hangout/reward zone. Vocabulary: colors, numbers 1–20, foods, animals, greetings.
- **Outfit unlocks:** Earned from any game (not just Café), applied to Pirouette in Café.
- **Decoration philosophy:** Intentional theming only — no random ✦ ✧ sparkle characters floating in game boards. Each world has its own emoji theme.

## Git worktree note

Preview server runs from `.claude/worktrees/hardcore-antonelli/`. After committing to main, sync the worktree:
```bash
cd /Users/Jorpy/Desktop/code/morgan-site/.claude/worktrees/hardcore-antonelli && git merge main --no-edit
```
