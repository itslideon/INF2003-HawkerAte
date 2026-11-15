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

## 4. API + UI

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

http://localhost:3000/health — `mariadb` and `mongo` should be `"up"`.

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open http://localhost:5173.

## 5. Demo path

1. **Order** — first centre in `GET /centres` (sorted by **name**, so often ABC Brickworks, not Maxwell). Use the stall chips to switch cuisine. Maxwell **Rice** is still there for the money demo; there is no centre picker yet. Add a cheap dish (Kopi) if the demo wallet is tight.
2. Checkout — simulated PayNow / card / cash (same wallet).
3. **Makan split** — type friend `customer_id`s that already have wallets (e.g. 2 and 3 after `generate_orders.py`). `test_inserts.sql` alone only creates customer **1**. Friends do not log in.
4. **Owner** — takings + refund by order id. Do not refund an order that already has a Makan split (API returns 409).
5. **Centre admin** / **Investor** — SQL views. Extra centres from the NEA load show here even if Order still opens the first centre.

Login on the site does not check a password and is not stored in MariaDB.

## 6. Optional volume data

After fintech + queue schema:

```bash
python etl/scripts/generate_orders.py
python etl/scripts/generate_mongo_events.py
```

Default 2000 orders. Then `GET /analytics/payments/reconcile` should report `"all_match": true`.
