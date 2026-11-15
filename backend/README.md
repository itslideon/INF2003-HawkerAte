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
- `PUT /reviews/<id>` / `DELETE /reviews/<id>` — edit or soft-delete your own review (`customer_id` in the body)

Checkout (one MariaDB transaction, then a Mongo `payment_events` doc):

- `POST /orders/pay` — if Mongo fails after SQL commit, SQL still stands and `mongo_written` is `false`. Response includes `queue` (`ticket_no`, `ahead`, `now_serving_ticket`).
- `POST /orders/<id>/refund` — reversing `ledger_entry`, wallet credit, status `refunded`; never deletes payment/ledger. Mongo refund event after SQL (`mongo_written`). Drops the queue row. `409` if the order already has a Makan split.
- `POST /dining-sessions` / `GET /dining-sessions/<id>` / `GET /orders/<id>/dining-session` — **Makan split** on a **paid** order (equal / by_item / custom).
- `POST /dining-sessions/<id>/settle` — friend wallet → organizer (`split_settle` ledger). Not another stall pay. `400` if the stall order is no longer `paid`. Apply `sql/schema/03_split.sql`.

Queue (`stall_queue`, apply `sql/schema/04_queue.sql`):

- `GET /stalls/<id>/queue`
- `GET /orders/<id>/queue`
- `POST /orders/<id>/ready` — leave the line

Owner (apply `sql/views/v_owner_takings.sql` and `v_daily_settlement.sql`):

- `GET /stalls/<id>/takings` — today’s SQL totals for one stall (`0` if none)
- `GET /settlement` — today’s paid sales by stall; `?date=YYYY-MM-DD` for another day

Ids in Mongo are strings of the MariaDB ints (`1` → `"1"`). Request/response shapes: `docs/api-contract.md`.

Centre admin and investor (read-only; apply `sql/views/v_admin_centre_compare.sql` and `v_investor_rank.sql`):

- `GET /centres/<id>/admin-summary` — stalls in one centre from the view; ratings joined from Mongo when it is up
- `GET /investor/rank` — centres ordered by takings

Mongo analytics (Wileen; `payment_events`):

- `GET /analytics/payments/by-stall`
- `GET /analytics/payments/by-method` — optional `?stall_id=`
- `GET /analytics/payments/net-by-stall` — gross / refunded / net
- `GET /analytics/payments/reconcile` — Mongo vs MariaDB `SUM(payment.amount)` (`all_match`)

## Setup

From the repo root.

1. Copy `.env.example` to `.env`. Fill `DB_*` (MariaDB) and `MONGO_URI` / `MONGO_DB` (Atlas Database Access user, not the Atlas website login). Don’t commit `.env`.
2. Create DB `hawkerate`. Apply schema in the order in `sql/README.md` (`01_core` → `02_fintech` → `03_split` → `04_queue` → views → `indexes.sql`). Optional sample rows: `sql/schema/test_inserts.sql` after `01_core.sql`. Load NEA centres/menus with `etl/scripts/load_centres_stalls.py` then `load_prices.py` (`etl/README.md`).
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

Pay, refund, Makan split, queue, owner/admin/investor, and analytics routes are implemented. Shapes: `docs/api-contract.md`. Volume data: `etl/scripts/generate_orders.py` then `generate_mongo_events.py`.
