# Frontend — Owner: KRISTEN

This is where the app code lives. Put the actual project here (the
existing ordering/payment-flow build with mock-mode data already
covers login, diner browse, cart, checkout, and a PayNow-style payment
screen).

- `../docs/api-contract.md` — exact endpoints/fields this UI expects
  from Lideon's backend. Swap the mock data layer for real fetch calls
  against `API_BASE_URL` (see `../.env.example`) once each endpoint is live.
- Keep a "waiting for backend" state for anything not in the contract
  yet — no hardcoded fake stalls/totals in the Iter 1–2 demos.

TODO Kristen: sketch (don't have to build yet) the owner/admin/investor
routes per the Iter 1 plan; wire diner browse to real `/centres` and
`/centres/:id/stalls` reads for the 3 Oct demo.

## Running it

Run these from the repo's main folder (`INF2003-HawkerAte/`), no need to
`cd frontend` first (needs Node 18+):

```bash
npm --prefix frontend install    # first time only, and again after pulling if package.json changed
npm --prefix frontend run dev    # starts the dev server and hosts the app locally
```

(If you're already inside `frontend/`, plain `npm install` / `npm run dev`
works too.)

Then open <http://localhost:5173>. The page hot-reloads when you save a
file. Leave the terminal open while you work; press `Ctrl+C` to stop the
server. If port 5173 is busy, Vite picks the next free one and prints the
URL it chose — use that instead.

Other commands: `npm --prefix frontend run build` (production bundle into
`frontend/dist/`), `npm --prefix frontend run preview` (serve that bundle
locally).

Until the backend is live, the app runs on mock data. To point it at the
real API, set `VITE_API_BASE_URL` in a `frontend/.env` file (Vite only
exposes variables that start with `VITE_`), then restart `npm run dev`.

## What the config files are

- **`package.json`** — the project manifest. `scripts` has the commands
  you'll actually run (`dev`, `build`, `preview`, `lint`);
  `dependencies` ships in the real app (React, React Router);
  `devDependencies` are dev-only tools (Vite, the Tailwind plugin,
  ESLint) that don't get bundled.
- **`vite.config.js`** — config for Vite, the tool that runs `npm run
  dev`/`npm run build`. It registers two plugins: `@vitejs/plugin-react`
  (so Vite understands JSX and gives fast refresh on save) and
  `@tailwindcss/vite` (runs Tailwind as part of the build — it's why
  `src/index.css` can just say `@import "tailwindcss"` with no separate
  PostCSS config). Everyone needs this file; it's core project config,
  not optional.
- **`.claude/`** — personal Claude Code tooling config (tells it how to
  preview the dev server), not shared project setup. It's gitignored —
  you won't see it after pulling, and you don't need it.
