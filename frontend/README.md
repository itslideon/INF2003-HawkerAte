# Frontend

Vite + React app for HawkerAte. Browse, cart, checkout with simulated PayNow / card / cash, plus login and account pages.

From the repo root (Node 18+):

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open http://localhost:5173. Leave the terminal running; Ctrl+C to stop. If 5173 is taken, Vite prints another port — use that.

You can also `cd frontend` and run `npm install` / `npm run dev` as usual.

`npm --prefix frontend run build` writes a production bundle to `frontend/dist/`. `npm --prefix frontend run preview` serves that bundle.

Until the API is running, the UI uses mock dishes and local orders. To hit the real API, add `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:3000
```

Vite only exposes variables that start with `VITE_`. Restart `npm run dev` after changing it.

`package.json` and `vite.config.js` are the usual React + Tailwind setup; leave them as they are.
