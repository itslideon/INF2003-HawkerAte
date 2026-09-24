# HawkerAte

INF2003 group project. We built a hawker stall payments demo: customers can browse centres, place an order, and pay with simulated PayNow, card, or cash. Stall owners can see takings. Nothing here talks to a real bank.

**MariaDB** is the source of truth for money. **MongoDB** stores payment events, reviews, and an investor watchlist.

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

1. Install MariaDB and create database `hawkerate`. Apply schema in order (`sql/README.md`): `01_core.sql`, then `02_fintech.sql`. Optional: `test_inserts.sql` for sample rows, `03_split.sql` when working on group bills.
2. MongoDB Atlas (or local `mongod`): Database Access user + Network Access for your IP (`nosql/README.md`). Database name `hawkerate`.
3. Copy `.env.example` → `.env` at the repo root. Fill MariaDB `DB_*` and Atlas `MONGO_URI` / `MONGO_DB`. No space after `=`. Don’t commit `.env`.
4. API: `pip install -r backend/requirements.txt` then `python backend/app.py` → http://localhost:3000  
   Check `GET /health` — both `mariadb` and `mongo` should be `"up"`.
5. UI: `npm --prefix frontend install` then `npm --prefix frontend run dev` → http://localhost:5173  
   Set `VITE_API_BASE_URL=http://localhost:3000` in `frontend/.env`.

Folder READMEs have the extra detail (Windows MariaDB, PowerShell `curl`, Atlas).

## Status

**Working in the API:** browse centres/stalls/menu, stall reviews (Mongo), checkout `POST /orders/pay` (one MariaDB transaction, then a `payment_events` document).

**Not built yet:** refunds, dining-session split HTTP APIs, owner/admin/investor endpoints, ETL order generator (`etl/scripts/generate_orders.py` is still a stub).

Ids: MariaDB `INT AUTO_INCREMENT`; Mongo stores the same values as strings (`"1"`).

## Design notes

Payments are simulated. One checkout is one SQL transaction; a Mongo payment event is written only after that commit succeeds. Wallet balances change through ledger rows, not by editing `wallet.balance` directly. Refunds add a reversing ledger entry instead of deleting history. Stall rows are soft-deleted.

Ids are integers in MariaDB (`AUTO_INCREMENT`). Mongo stores the same ids as strings (`"1"`, `"2"`, …).
