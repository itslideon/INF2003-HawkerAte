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

1. Create the MariaDB database `hawkerate` and run the scripts in `sql/` (see `sql/README.md`).
2. Set up MongoDB (`nosql/README.md`). Database name is `hawkerate`.
3. Copy `.env.example` to `.env` and fill in local credentials. Don’t commit `.env`.
4. Start the API: `pip install -r backend/requirements.txt` then `python backend/app.py`
5. Start the UI: `npm --prefix frontend install` then `npm --prefix frontend run dev`

More detail is in each folder’s README.

## Design notes

Payments are simulated. One checkout is one SQL transaction; a Mongo payment event is written only after that commit succeeds. Wallet balances change through ledger rows, not by editing `wallet.balance` directly. Refunds add a reversing ledger entry instead of deleting history. Stall rows are soft-deleted.

Ids are integers in MariaDB (`AUTO_INCREMENT`). Mongo stores the same ids as strings (`"1"`, `"2"`, …).
