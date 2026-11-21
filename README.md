# HawkerAte

INF2003 group project. We built a hawker stall payments demo: customers can browse centres, place an order, and pay with simulated PayNow, card, or cash. Stall owners can see takings. Nothing here talks to a real bank.

**MariaDB** is the source of truth for money. **MongoDB** stores payment events and reviews (optional `investor_watchlist` collection; the thin investor screen reads SQL, not a watchlist UI).

Repo: https://github.com/itslideon/INF2003-HawkerAte

## Group

| Name | Area |
|------|------|
| Tanvi | Relational schema and ER diagram |
| Lancea | SQL views, queries, indexes, and datasets |
| Lideon | Orders, payments, ledger, APIs |
| Wileen | MongoDB |
| Kristen | Frontend |

## Layout

- `sql/` — MariaDB schema, views, and indexes
- `nosql/` — Mongo collections and aggregations
- `etl/` — load official hawker data and generate sample orders
- `backend/` — HTTP API the UI calls
- `frontend/` — web app
- `docs/` — reports, ER, user manual

## How to run

Start from a clone with Node 18+ and Python 3. Schema order is in `sql/README.md`. Official hawker rows are **not** in git (`etl/raw/` is gitignored) — load them after `01_core.sql` or the UI only has the optional test stall.

1. Install MariaDB and `CREATE DATABASE hawkerate`. Apply `sql/schema/01_core.sql`, then `02_fintech.sql`, `03_split.sql`, `04_queue.sql`, then `sql/views/*.sql` and `sql/indexes.sql` (`sql/README.md`). Optional: `test_inserts.sql` **after** `01_core.sql` (one Maxwell “Rice” stall + Fried Rice + a wallet).
2. Download the two NEA files into `etl/raw/` (names must match; details in `etl/README.md` / `etl/raw/README.md`):
   - `d_68a42f09f350881996d83f9cd73ab02f.csv`
   - `d_4a086da0a5553be1d89383cd90d07ecd.geojson`
3. From the repo root (uses `.env` `DB_*`):

```bash
python etl/scripts/load_centres_stalls.py
python etl/scripts/load_prices.py
```

   Expect about **107 centres**, **~8 stalls per empty centre**, **9 dishes per stall**. If Maxwell already has the Rice test row, that centre is **skipped** (other centres still load). `load_prices.py` also **renames** leftover `Stall 1`/`Stall 2` labels to cuisine names (`UPDATE` only — `stall_id` stays). Re-run is safe. It will fetch SingStat CPI into `etl/raw/singstat_cpi.csv` if it is missing.
4. MongoDB Atlas (or local `mongod`): Database Access user + Network Access for your IP (`nosql/README.md`). Database name `hawkerate`.
5. Copy `.env.example` → `.env` at the repo root. Fill MariaDB `DB_*` and Atlas `MONGO_URI` / `MONGO_DB`. No space after `=`. Don’t commit `.env`.
6. API: `pip install -r backend/requirements.txt` then `python backend/app.py` → http://localhost:3000  
   Check `GET /health` — both `mariadb` and `mongo` should be `"up"`.
7. UI: `npm --prefix frontend install` then `npm --prefix frontend run dev` → http://localhost:5173  
   In `frontend/.env` set `VITE_API_BASE_URL=http://localhost:3000`. Optional: `VITE_DEMO_CUSTOMER_ID=5` so checkout uses a wallet that can cover a typical dish (test customer 1 is only $3.50). Dish photos are frontend files mapped by dish name (`frontend/src/lib/dishPhoto.js`); the menu API does not store images.

Folder READMEs have the extra detail (Windows MariaDB, PowerShell `curl`, Atlas, generated orders).

## Status

**Working in the API:** browse centres/stalls/menu, stall reviews (Mongo GET/POST/PUT/DELETE), checkout `POST /orders/pay` (one MariaDB transaction, then a `payment_events` document), stall queue (`04_queue.sql`), `POST /orders/:id/refund` (reversing ledger, Mongo refund event after SQL), owner takings/settlement, **Makan split** (`POST /dining-sessions` and settle), `GET /centres/<id>/admin-summary`, `GET /investor/rank`, Mongo analytics (`/analytics/payments/by-method`, `net-by-stall`, `reconcile`).

`generate_orders.py` default **2000** orders → `etl/raw/generated_orders.csv` → `generate_mongo_events.py`.

The diner Order page has a **centre dropdown** (`GET /centres`, sorted by name). Default is the first centre (often ABC Brickworks after the NEA load) or the last one saved in the browser. Stall chips switch cuisine at that centre. Dish photos are frontend-only (`frontend/src/lib/dishPhoto.js`).

## Design notes

Payments are simulated. One checkout is one SQL transaction; a Mongo payment event is written only after that commit succeeds. Wallet balances change through ledger rows, not by editing `wallet.balance` directly. Refunds add a reversing ledger entry instead of deleting history. Stall rows are soft-deleted. Ids are MariaDB `INT AUTO_INCREMENT`; Mongo stores the same values as strings (`"1"`).
