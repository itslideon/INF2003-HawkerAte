# HawkerAte (INF2003)

Hawker stall digital payments and owner takings. Payments are **simulated** (PayNow / card / cash) — not live banking.

**Repo:** https://github.com/itslideon/INF2003-HawkerAte

**Stack:** MariaDB (InnoDB) = money source of truth · MongoDB = events / reviews / watchlist

## Team

| Person | Role |
|---|---|
| **Tanvi** | MariaDB core schema + ER. Does **not** own pay transactions, Mongo, or UI. |
| **Lancea** | Analytics SQL, views, indexes, progress-report draft, help load official data. Helps with ER, Mongo design, and UI. |
| **Lideon** | Fintech tables + pay / refund / split + **integration**. Helps with Mongo design, ER, and UI. |
| **Wileen** | Mongo collections, aggregations, speed test. Works with Tanvi on MariaDB table design. |
| **Kristen** | Frontend, wire to real APIs, UI user manual. |

## Folders

| Folder | What goes here | Owner |
|---|---|---|
| `sql/schema/01_core.sql` | `hawker_centre`, `stall`, `menu_item`, `customer`, `wallet` | Tanvi |
| `sql/schema/02_fintech.sql` | `orders`, `order_line`, `payment`, `ledger_entry` | Lideon |
| `sql/schema/03_split.sql` | `dining_session`, `session_member` (Iter 3) | Lideon |
| `sql/views/`, `sql/queries/`, `sql/indexes.sql` | Settlement / owner / admin / investor SQL | Lancea |
| `sql/README.md` | How to create the DB and run scripts in order | Tanvi |
| `nosql/` | Models, aggregations, perf notes. DB name: `hawkerate` | Wileen |
| `etl/raw/` + load scripts | Official NEA / SingStat files and loaders | Lancea |
| `etl/scripts/generate_orders.py` | Generated orders / ledger | Lideon |
| `etl/scripts/generate_mongo_events.py` | Matching Mongo events | Wileen |
| `frontend/` | App + how to run. No hardcoded fake numbers | Kristen |
| `docs/er/` | ER diagram | Tanvi |
| `docs/progress-report/` | 2-page Week 5 report | Lancea drafts |
| `docs/user-manual/` | How to run the system | Kristen (UI), Tanvi (MariaDB), Wileen (Mongo) |

MariaDB rules: `ENGINE=InnoDB`, money as `DECIMAL(10,2)`, one pay = one SQL transaction, never hand-edit wallet balance, refund = reversing ledger (do not delete ledger rows).

Mongo rules: insert `payment_events` **after** MariaDB commit. Do not duplicate the whole ledger in Mongo.

## Local setup

Coming once MariaDB + Mongo + the app skeleton exist. Clone this repo so everyone works on the same tree.
