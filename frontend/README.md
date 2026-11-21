# Frontend

Vite + React app for HawkerAte. Browse, cart, checkout with simulated PayNow / card / cash, plus login and account pages.

From the repo root (Node 18+):

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open http://localhost:5173. Leave the terminal running; Ctrl+C to stop. If 5173 is taken, Vite prints another port, so use that.

You can also `cd frontend` and run `npm install` / `npm run dev` as usual.

`npm --prefix frontend run build` writes a production bundle to `frontend/dist/`. `npm --prefix frontend run preview` serves that bundle.

Browse, reviews, and checkout talk to Flask. Set `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_DEMO_CUSTOMER_ID=5
```

Login is localStorage only (not real auth). Checkout still pays from the demo wallet id above — customer 1 from `test_inserts.sql` only has $3.50.

Order loads `GET /centres` (sorted by name) and a **centre dropdown**. Default is the first centre, or the last one saved in the browser. Stall labels come from MariaDB (`stall.name`). Dish photos are **not** in MariaDB. `GET /stalls/:id/menu` returns name and price; `src/lib/dishPhoto.js` maps each seeded dish name to a file in `src/assets/order-dish-*`. Unknown names fall back to an emoji (`src/lib/dishEmoji.js`).

Other screens: `/map`, `/checkout`, `/orders/:id/split` (Makan split), `/owner` (takings + refund), `/stall` (cook queue), `/admin`, `/investor`.

Vite only exposes variables that start with `VITE_`. Restart `npm run dev` after changing `.env`.

`package.json` and `vite.config.js` are the usual React + Tailwind setup; leave them as they are.
