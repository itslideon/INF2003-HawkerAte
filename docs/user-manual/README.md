# User manual — how to run HawkerAte

From a clean clone. Payments are **simulated**. Do not commit `.env`.

## What you need

- MariaDB, Python 3, Node 18+
- A MongoDB Atlas cluster (or local `mongod`) named `hawkerate`
- Two NEA files in `etl/raw/` (gitignored) — see `etl/raw/README.md`

## 1. Database schema

```sql
CREATE DATABASE IF NOT EXISTS hawkerate CHARACTER SET utf8mb4;
```

Apply in this order (`sql/README.md`):

`01_core.sql` → `02_fintech.sql` → `03_split.sql` → `04_queue.sql` → `sql/views/*.sql` → `indexes.sql`

Optional: `test_inserts.sql` after `01_core.sql` (Maxwell **Rice** + a $20 wallet). If you use it, the later NEA load **will not add extra stalls at Maxwell**.

## 2. Official hawker data

Save into `etl/raw/`:

- `d_68a42f09f350881996d83f9cd73ab02f.csv`
- `d_4a086da0a5553be1d89383cd90d07ecd.geojson`

```bash
python etl/scripts/load_centres_stalls.py
python etl/scripts/load_prices.py
```

You should see about 107 centres and nine dishes on each seeded stall. `load_prices.py` then **renames** `Stall 1`/`Stall 2` to cuisine names (`UPDATE` of `stall.name` only — ids stay, so existing orders and Mongo events stay valid). Re-run that script anytime to pick up names without wiping the DB. Details: `etl/README.md`.

## 3. Config

Copy `.env.example` → `.env` at the repo root (`DB_*`, `MONGO_URI`, `MONGO_DB=hawkerate`).

`frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_DEMO_CUSTOMER_ID=5
```

Checkout always pays from that integer wallet. Customer **1** from `test_inserts.sql` only has $3.50.

## 4. API + UI

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

http://localhost:3000/health — `mariadb` and `mongo` should be `"up"`. Flask has no homepage; use `/health` or the Vite app.

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open http://localhost:5173.

## 5. Demo path

1. **Order** — use the **Centre** dropdown (and optional **Map** at `/map`) to pick a hawker centre. Default is the first centre by name (often ABC Brickworks after the NEA load), or the last centre saved in the browser. Stall chips switch cuisine at that centre. For the money demo, pick **Maxwell Food Centre** → **Rice**. Add a cheap dish (Kopi) if the demo wallet is tight. Dish photos are frontend files mapped by dish name, not MariaDB columns.
2. **Checkout** — simulated PayNow / card / cash. All three debit the same MariaDB wallet (cash is not a separate till).
3. **Makan split** — after pay, open split on that order. Type friend `customer_id`s that already have wallets (e.g. 2 and 3 after `generate_orders.py`). `test_inserts.sql` alone only creates customer **1**. Friends do not log in; **Settle** on the same screen stands in for each friend. Equal and custom splits work; split-by-item is in the API but not wired on this screen.
4. **Owner** (`/owner`) — takings + refund by order id. Do not refund an order that already has a Makan split (API returns 409).
5. **Cook** (`/stall`) — queue for the selected stall. Anyone who knows the URL can mark ready (there is no staff login). After `generate_orders.py`, a busy stall can have a very long list.
6. **Centre admin** (`/admin`) / **Investor** (`/investor`) — SQL views. Extra centres from the NEA load show here.

**Login / Account** on the site is localStorage only: it does not check a password, is not stored in MariaDB, and does **not** change who pays. Wallet, split, and refund always use `VITE_DEMO_CUSTOMER_ID`. Contact on the home page is display-only.

## 6. Optional volume data

After fintech + queue schema:

```bash
python etl/scripts/generate_orders.py
python etl/scripts/generate_mongo_events.py
```

Default 2000 orders. Then `GET /analytics/payments/reconcile` should report `"all_match": true`.
