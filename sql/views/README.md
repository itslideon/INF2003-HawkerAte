# Views

Run these after `schema/01_core.sql` and `schema/02_fintech.sql`. Split-related views also need `03_split.sql`.

Run after `01_core.sql` and `02_fintech.sql`. Empty result or zeros mean no paid orders yet — the UI must not invent totals.

`GET /stalls/:id/takings` and `GET /settlement` read the Iter 2 views. `GET /centres/:id/admin-summary` and `GET /investor/rank` read the Iter 3 views.

| File | What it’s for | When |
|------|----------------|------|
| `v_daily_settlement.sql` | Daily sales, average ticket by cuisine, cash vs PayNow | Iter 2 |
| `v_owner_takings.sql` | Totals for a stall owner dashboard | Iter 2 |
| `v_admin_centre_compare.sql` | Stalls in one centre: revenue, grade, peak hour, refund flag | Iter 3 |
| `v_investor_rank.sql` | Compare centres (takings, cashless %, grade). Read-only | Iter 3 |
