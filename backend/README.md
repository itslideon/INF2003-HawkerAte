# API

Flask app between the UI, MariaDB, and Mongo. Listens on http://localhost:3000.

## Endpoints

Browse (MariaDB):

- `GET /health` — `{ ok, mariadb, mongo, … }` (`200` only if both are up)
- `GET /centres`
- `GET /centres/<id>/stalls`
- `GET /stalls/<id>/menu`

Reviews (Mongo):

- `GET /stalls/<id>/reviews`
- `POST /reviews`

Checkout (one MariaDB transaction, then a Mongo `payment_events` doc):

- `POST /orders/pay` — if Mongo fails after SQL commit, SQL still stands and `mongo_written` is `false`

Ids in Mongo are strings of the MariaDB ints (`1` → `"1"`). Request/response shapes: `docs/api-contract.md`.

Not implemented here yet: refund, dining sessions, admin summary, investor rank.

## Setup

From the repo root.

1. Copy `.env.example` to `.env`. Fill `DB_*` (MariaDB) and `MONGO_URI` / `MONGO_DB` (Atlas Database Access user, not the Atlas website login). Don’t commit `.env`.
2. Create DB `hawkerate`. Apply `sql/schema/01_core.sql` then `sql/schema/02_fintech.sql`. Optional sample rows: `sql/schema/test_inserts.sql`.
3. Atlas: Network Access must include this machine’s IP or the ping will fail with an SSL handshake error.
4. Install and run:

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

Restart the process after changing `.env` (it is read at startup).

Frontend: `VITE_API_BASE_URL=http://localhost:3000` in `frontend/.env`.

### Windows notes

- If MariaDB is not installed as a service, start `mysqld` with a quoted `--defaults-file=` path (the data directory often has a space in it).
- PowerShell’s `curl` is an alias. For JSON bodies use `curl.exe --%` or `Invoke-RestMethod`.

## Next (API)

1. Confirm `GET /health` with both databases up, then a real `POST /reviews` and `POST /orders/pay` against local MariaDB + Atlas.
2. Iter 2–3: `POST /orders/:id/refund`, dining-session split, keep ledger append-only.
3. `etl/scripts/generate_orders.py` — same rules as pay; write ids to `etl/raw/generated_orders.csv` for the Mongo event loader.
