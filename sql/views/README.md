# Views

Run these after `schema/01_core.sql` and `schema/02_fintech.sql`. Split-related views also need `03_split.sql`.

Run after `01_core.sql` and `02_fintech.sql`. Iter 2 views are live: empty result / zeros mean no paid orders yet — the UI must not invent totals.

`GET /stalls/:id/takings` and `GET /settlement` read these views.

| File | What it’s for | When |
|------|----------------|------|
| `v_daily_settlement.sql` | Daily sales, average ticket by cuisine, cash vs PayNow | Iter 2 |
| `v_owner_takings.sql` | Totals for a stall owner dashboard | Iter 2 |
| `v_admin_centre_compare.sql` | Stalls in one centre: revenue, grade, peak hours, flags | Iter 3 |
| `v_investor_rank.sql` | Compare centres / stalls (takings, cashless %, grade) | Iter 3 |
