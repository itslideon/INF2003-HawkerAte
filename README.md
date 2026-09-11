# HawkerAte

INF2003 Database Systems group project. MariaDB (InnoDB) is the money
source of truth; MongoDB holds events/reviews/watchlist. Payments are
simulated (PayNow / card / cash) — **not** live banking.

Repo: https://github.com/itslideon/INF2003-HawkerAte

## Team

| Member  | Owns |
|---------|------|
| Tanvi   | ER diagram, `sql/schema/01_core.sql` |
| Lancea  | Analytics SQL (views/queries/indexes), datasets/ETL, progress report |
| Lideon  | `sql/schema/02_fintech.sql` + `03_split.sql`, pay/refund/split, integration & API |
| Wileen  | MongoDB collections, aggregations, speed test |
| Kristen | Frontend, wiring to real APIs, UI user manual |

Everyone helps outside their own file per the plan — see each folder's
README for who's allowed to review vs. rewrite.

## Folder map

- `sql/` — MariaDB schema, views, queries, indexes (Tanvi + Lideon + Lancea)
- `nosql/` — MongoDB models, aggregations, perf tests (Wileen)
- `etl/` — official data loaders + fake-data generators (Lancea + Lideon + Wileen)
- `frontend/` — the app (Kristen)
- `docs/` — ER, progress report, final report, user manual, video script

## Setup order

1. `sql/README.md` — create the DB, run schema files in order
2. `nosql/README.md` — start Mongo, DB name `hawkerate` (never rename)
3. `etl/README.md` — load official data, then generate fake orders/events
4. `frontend/README.md` — run the app
5. `docs/api-contract.md` — the endpoints the frontend expects from the backend

## Deadlines

- **Progress report:** Week 5, **4 Oct 2026, 11:30 PM** — XSite *group*
  Dropbox, ONE pdf/docx, max 2 pages, Calibri 12, exactly 4 sections.
- **Final:** **29 Nov 2026** — report ≤10 pages; slides + video ≤10 min
  (all 5 names on screen); source code + user manual. Project = 50% of
  module (25% relational / 25% NoSQL), peer review weighted.

## Iterations

| Iter | Dates | Goal |
|------|-------|------|
| 1 | 9 Sep – 3 Oct 2026 | Frozen idea, MariaDB core running, a few centres/stalls on screen, Mongo collections designed |
| 2 | 4 – 25 Oct 2026 | Diner order + pay in one MariaDB transaction; Mongo event after commit; owner sees real takings |
| 3 | 26 Oct – 15 Nov 2026 | Friend split, refund, centre admin, reviews, thin investor view |
| 4 | 16 – 29 Nov 2026 | Volume (tens of thousands of orders), speed test, user manual, final report + video |

Feature freeze ~22 Nov — bugs and writing only after that.

## Hard rules (don't break these)

- `ENGINE=InnoDB` everywhere; money columns `DECIMAL(10,2)`; IDs `INT AUTO_INCREMENT`
- One pay = one SQL `TRANSACTION`
- Never hand-edit `wallet.balance` — it only changes via `ledger_entry`
- Never `DELETE` a `ledger_entry` row — a refund is a new reversing entry
- Soft-delete stalls, never hard-delete
- Insert a Mongo `payment_events` doc only **after** the MariaDB commit succeeds
- Mongo collections do NOT count toward the "9 SQL tables" — they're a separate NoSQL half
- Do not build: live PayNow/SGQR/Stripe, real cards, KYC, bank APIs, lending, chat/social, or 12+ SQL tables before week 5

## Minimum deliverable shape

9 SQL tables: `hawker_centre`, `stall`, `menu_item`, `customer`, `wallet`,
`orders`, `order_line`, `payment`, `ledger_entry` (+ `dining_session`,
`session_member` in Iter 3). 2+ Mongo collections: `payment_events`,
`reviews` (+ optional `investor_watchlist`).
