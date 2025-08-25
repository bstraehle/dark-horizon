# DARK HORIZON

Fast, responsive space shooter built with HTML5 Canvas and vanilla JavaScript (ES modules). Dominate yellow stars (+20) and red bonus stars (+50), destroy asteroids (+10), and chase a new high score — but beware: some asteroids are indestructible.

## Quick start

Because `index.html` loads ES modules (`type="module"`), the game must run from a web server (file:// won’t work).

- Option A — VS Code Live Server: install “Live Server”, then click “Go Live”.
- Option B — Windows PowerShell (Python 3):
  - Preferred: `py -m http.server 8000`
  - Fallback: `python -m http.server 8000`
  - Then open http://localhost:8000
- Option C — Node.js (if installed): `npx serve -l 8000 .`

- Build for production: `npm install` → `npm run build`; then serve `dist/` to preview (e.g., `py -m http.server 8000` and open http://localhost:8000/dist/)

Or use the npm scripts (requires Node.js):

- Install deps: `npm install`
- Dev server: `npm run serve` then open http://localhost:8000 (served from the project root)
- Rebuild on save (no server): `npm run watch`

## Development and build

- Production build: `npm run build`
  - Output goes to `dist/` with `bundle.js`, `style.css`, `favicon.png`, and a production `index.html` (derived from `index.prod.html`).
  - To preview the production build, serve the folder and open dist:
    - PowerShell (project root as server): `py -m http.server 8000` then open http://localhost:8000/dist/
    - Or serve the folder directly: `npx serve -l 8000 dist`

### Troubleshooting

- Blank page or “Failed to load module script/CORS” → you opened via file://. Start a server (see above).
- `python` not recognized on Windows → use `py -m http.server 8000`.
- Port already in use → try another port, e.g. `py -m http.server 5500`.
- High score not saving → Private/Incognito may block `localStorage`.
- Strict CSP: `index.html`/`index.prod.html` use a strict Content-Security-Policy; inline scripts or external domains aren’t allowed.

## How to play

- Move: Arrow keys or WASD, or guide with mouse/touch
- Shoot: Space, mouse click, or tap
- Pause/Resume: Esc
- Score: +10 per asteroid, +20 per yellow star, +50 per red star
  - One red star appears after every 10 yellow stars
  - Some asteroids are indestructible; bullets can't destroy them
- Game over: Collide with an asteroid
- Restart: Click “Launch Mission” or “Play Again”

## Features

- Desktop and mobile friendly (keyboard, mouse, and touch)
- Smooth animations with requestAnimationFrame
- Starfield, nebulae, engine glow, explosions, and particle FX
- High score persisted with `localStorage`
- Accessibility touches: focus guards for overlays, ARIA labels, and restored focus on tab return
- Indestructible asteroids appear periodically to increase challenge

## Project structure

- `index.html` — App shell and canvas
- `style.css` — Layout and responsive styles
- `js/constants.js` — Tunable settings (colors, sizes, speeds, spawn rates)
- `js/game.js` — Game loop, state, and high-level orchestration
- `js/entities/` — Entities (Player, Asteroid, Bullet, Star, EngineTrail, Explosion, Particle, Background, Nebula, StarField)
- `js/managers/` — Focused modules that keep `game.js` small:
  - `BackgroundManager` — init/draw background, nebulae, starfield, pause overlay
  - `InputManager` — keyboard, mouse, touch, and focus guards (Esc for pause)
  - `SpriteManager` — pre-rendered sprites for bullets and yellow/red stars
  - `UIManager` — DOM updates, overlays, and high score load/persist
  - `CollisionManager` — bullets/asteroids/player/star collisions and side-effects
  - `SpawnManager` — spawning and creation of asteroids and stars
  - `RenderManager` — draw routines for bullets, stars, particles, explosions, asteroids
  - `ViewManager` — canvas resize and DPR transform
- `favicon.png` — Site icon

## Technical notes

- Canvas-based rendering with gradients and shadows
- ES modules split logic across `game.js`, `entities/*`, and `managers/*`
- Mobile tweaks: touch controls and reduced asteroid speed
- High score key: `darkHorizonHighScore` in `localStorage`

## Types overview

The project uses JSDoc with TypeScript’s `checkJs` for stronger tooling without converting to TS.

- Shared typedefs live in `js/types.js`:
  - `ViewSize`, `RNGLike` — common shapes
  - `SpriteAtlas` — pre-rendered sprites from `SpriteManager.createSprites()`
  - `SystemsGame`, `CollisionGameSlice` — input “slices” for update/collision systems
  - `GameEvent` — event names emitted via the event bus
  - `GameState` — high-level shape of the main game orchestrator
- Modules reference shared types via `import('../types.js').TypeName` in JSDoc.
- This keeps runtime vanilla JS while enabling editor intellisense and typechecking.

## Deploy

This is a static site. You can deploy the source (served from a web server) or the production build in `dist/`:

- GitHub Pages: push the repo, enable Pages for the root of the main branch
- Netlify/Vercel: drag-and-drop the folder or connect the repo
  - If using the production build, deploy the `dist/` folder and set it as the publish directory

— Inspired by classic arcade shooters. Enjoy the flight.
