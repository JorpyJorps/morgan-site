# Morgan's Magic Garden — The Bible
*Read this before starting work. Read it again before finishing.*

---

## Who Morgan Is

Morgan Weber. 5 years old, turning 6 in early November. Starting kindergarten at the same school as her brother Miles.

She is sparkly, hyper, positive, silly, loving, and loud when she feels safe. She loves hard. She brings joy to every room.

**She has a speech delay** — trouble with S, SH, CH sounds and others. She has made enormous progress and may "graduate" OT soon. A speech therapy report is coming that will help us tune the app's sound targets. She is aware her speech is different from others and it can make her shy. The app should never make her feel that.

**She loves:** rainbows, unicorns, cats, penguins, dancing, gymnastics, swimming, soccer, big cities (Paris, New York, London), learning Spanish/French words, Fancy Nancy, Princess in Black, Where the Sidewalk Ends, pizza, burgers, snacks, PBS Kids, coloring on iPad, stickers, drawing, her family, her brother Miles, animals (a new favorite every week), girl rock music, sparkly things, being first, staying up late.

**She struggles with:** listening sometimes, hearing no, following multi-step instructions. She is not into puzzles naturally but we want to build that thinking muscle.

**She wants to be:** a dancer, a singer, a crossing guard, a mommy, a doctor, and a scientist.

**She prefers:** touchscreen tapping over mouse/keyboard. She navigates apps alone and should be able to use this one solo.

---

## The Goal

Help Morgan walk into kindergarten **confident and ready** — not just knowing her letters and numbers, but feeling *smart enough to raise her hand*.

The academic targets:
- Letters: name recognition, shape recognition, uppercase + lowercase
- Numbers: counting, numeral recognition
- Shapes: basic shape names and recognition
- Patterns: recognizing and completing sequences
- Colors: naming and matching
- Spatial reasoning: building, following visual instructions
- Memory: card matching, concentration
- French: simple vocabulary — her "secret weapon" subject

The confidence target: Morgan should open this app, do something hard, and walk away feeling like she crushed it.

---

## The One Rule

> **Morgan should never feel like she got something wrong. She should always feel like she's getting warmer.**

---

## Pirouette 🐱

The app mascot. A French cat (or penguin — Morgan picks on first launch).

**Name:** Pirouette (chosen because it's a ballet term, Morgan dances, and it has no S/SH/CH sounds)

**Personality:** Slightly dramatic, very silly, endlessly encouraging. She speaks a little French, a lot of warmth.

**Lives:** throughout the entire app — every game, every screen. She reacts to correct answers, wrong answers, and big finishes.

**States:** idle (floating), celebrate (bounce/spin), thinking (wobble)

**Her animal is saved in:** `localStorage` key `morgan_pirouette_animal_v1` — value is "cat" or "penguin"

**Future:** wardrobe unlocks, Tamagotchi-style care (no pressure mechanics — she's always happy to see Morgan, no guilt for being away), French Café as her home base.

**When we get Pirouette's real image:** photograph Morgan's stuffed animal → ChatGPT image gen → flat vector style, transparent background, friendly, facing forward, 4 poses (happy, thinking, celebrating, confused) → drop into app as one-line emoji swap.

---

## Design Principles

1. **Touch first.** Every tap target minimum 60px. Designed for iPad fingers, not mouse clicks.
2. **No reading required to navigate.** Every button has an audio label or is visually obvious. A 5-year-old should never be stuck because she can't read a word.
3. **No pressure, no punishment.** Wrong answers are "try again" not "WRONG." No timers. No lives. No streaks that guilt her.
4. **Not addictive by design.** No manipulative engagement loops. No "Pirouette is SAD you didn't visit." She comes back because it's fun, not because she's worried.
5. **Play that secretly teaches.** The learning is the vehicle, not the destination. It should feel like play.
6. **Decoration should be Morgan, not generic.** No random mushrooms. Every visual choice should connect to who she is.
7. **Pirouette reacts, not lectures.** She celebrates and encourages. She never explains or corrects with words.

---

## Tech Rules

### Always before starting work:
- [ ] Sync worktree with main: `git merge main --no-edit`
- [ ] Confirm preview server is running the latest code (not a cached worktree version)
- [ ] Read this bible

### Always before finishing work:
- [ ] All changes pushed to GitHub (`git push`)
- [ ] Vercel auto-deploys from GitHub — verify the deploy completed
- [ ] No console errors on the pages touched
- [ ] Test on mobile viewport (375px) — not just desktop
- [ ] Read this bible

### On pushing to GitHub:
Push every meaningful change, even small ones. This project uses **continuous deployment** — GitHub → Vercel auto-deploy. This is the right approach for a personal project like this. You don't need to batch changes. The only exception is if you're mid-way through a breaking change that would crash the live site — in that case finish the feature before pushing.

### Never:
- Leave game logic broken on main
- Push without testing the specific pages changed
- Add decorations without asking "is this Morgan?"
- Make Pirouette speak on every single interaction — audio should be purposeful
- Add text that a 5-year-old would need to read to play the game

---

## What's Built

| Game | Status | Notes |
|------|--------|-------|
| Home screen | ✅ Rebuilt | Pirouette hero, new card grid |
| Pirouette first-launch | ✅ Built | Animal picker, localStorage |
| Letters | ✅ Rebuilt | Pirouette reactions, adaptive weighting |
| Numbers | 🔜 Next | Needs Pirouette + polish |
| Shapes | 🔜 | Needs Pirouette + polish |
| Patterns | 🔜 | Needs Pirouette + polish |
| Memory Match | 🔜 | She likes this one, needs polish |
| Build It (Lego puzzle) | ❌ Not built | New game — spatial reasoning |
| Art Studio | 🔜 | She loves this — enhance + draw-to-answer |
| French Café | ❌ Not built | New — Pirouette's world |
| Colors | ❌ Placeholder | Needs full build |

---

## On the Backlog (don't lose these)

- Letter sounds / phonics mode (Level 3 in Letters: "find the letter that says 'buh'")
- Sight words game (separate from phonics — whole-word recognition)
- Draw-to-answer mechanic (draw a letter/shape instead of tapping)
- Pirouette wardrobe (French Café — swap animal, outfit, color, accessories)
- Pirouette Tamagotchi (no-pressure daily care — feed, dress, play)
- Girl Rock easter egg (get dad's 101-song Spotify playlist, wire in somewhere secret)
- Speech therapy report → tune sound game targets when received
- **Voice upgrade**: Current Web Speech API sounds robotic. Best long-term fix is pre-recorded MP3s per letter (warm, human voice — record once, play forever, no network needed). ElevenLabs can generate them. Short-term patch: pick best available system voice (Samantha on iOS, Google US English on Chrome) — already done.
- Confirm French is the right specialty subject after Morgan reacts to it
- Test with Morgan after each major update — she is the QA team

---

## The Dream

Morgan opens this app, spends 15 minutes with Pirouette, practices letters and some French words, draws something, unlocks a sticker — and walks into kindergarten in November knowing she can do hard things.

Her dad built it for her. That's the whole story.
