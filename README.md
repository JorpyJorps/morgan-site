# Morgan's Magic Garden

A simple local website project for Morgan with a magical homepage hub and placeholder activity pages for future mini-games.

## Run locally

1. Open a terminal in this folder.
2. Run `npm install` if dependencies are not installed yet.
3. Run `npm run dev`.
4. Open the local URL printed in the terminal.

The script prefers port `3001`. If `3001` is already in use, `serve` will choose another open port automatically.

## Project structure

- `index.html`:
  Homepage hub / world map
- `activities/`:
  Placeholder pages for future mini-games
- `styles.css`:
  Shared visual theme and layouts
- `script.js`:
  Small interaction polish for buttons and cards

## Next expansion points

- Build each mini-game directly inside its matching file in `activities/`
- Add shared components or utility scripts only when the site actually needs them
- Keep each activity visually distinct while reusing `styles.css` for the main design language
