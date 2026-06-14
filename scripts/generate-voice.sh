#!/usr/bin/env bash
# Generates Pirouette's voice clips with the macOS built-in `say` voice.
# Free, offline, no accounts. Re-run anytime to regenerate.
# Upgrade path: swap `say` for OpenAI TTS / ElevenLabs later — same filenames.
set -e
VOICE="${VOICE:-Samantha}"
OUT="assets/audio"
TMP="$OUT/tmp"
mkdir -p "$TMP"

gen () {  # gen <filename-without-ext> <text>
  say -v "$VOICE" -o "$TMP/$1.aiff" "$2"
  afconvert "$TMP/$1.aiff" "$OUT/$1.m4a" -d aac -f m4af >/dev/null
}

words=(zero one two three four five six seven eight nine ten \
  eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty)
for i in "${!words[@]}"; do
  gen "num-$i" "${words[$i]}"
done

# Pirouette warmth (reacts, never lectures)
gen "ok-magnifique" "Magnifique!"
gen "ok-bravo"      "Bravo!"
gen "ok-ohlala"     "Ooh la la!"
gen "try-again"     "So close! Try again."
gen "try-warmer"    "Getting warmer!"
gen "hello"         "Bonjour!"

rm -rf "$TMP"
echo "Generated $(ls -1 $OUT/*.m4a | wc -l | tr -d ' ') clips in $OUT with voice: $VOICE"
