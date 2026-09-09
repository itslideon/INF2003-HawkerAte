# HawkerCash (INF2003)

Hawker stall digital payments and owner takings. Payments are **simulated** (not live PayNow / Stripe).

**Stack:** MariaDB (relational, source of truth for money) + MongoDB (payment events, reviews, watchlist).

## Team

| Person | Owns |
|---|---|
| Tanvi | MariaDB schema / ER |
| Lancea | Analytics SQL, progress-report draft |
| (fintech) | Orders, pay, ledger, refund, split + repo integration |
| Wileen | MongoDB |
| Kristen | Frontend (all roles) |

## Folders

- `sql/` — MariaDB schema, views, seed
- `nosql/` — Mongo collections, aggregations
- `etl/` — load NEA / SingStat and generated orders
- `frontend/` — UI
- `docs/` — reports, user manual, ER notes

## Local setup

Coming once MariaDB + Mongo + the app skeleton exist. Clone this repo first so everyone works on the same tree.
