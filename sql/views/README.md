# Views — Owner: LANCEA

Planned views (names frozen in Iter 1, working SQL from Iter 2):

| File | Purpose | Iter |
|------|---------|------|
| `v_daily_settlement.sql` | today's sales, avg ticket by cuisine, cash vs PayNow | 2 |
| `v_owner_takings.sql` | per-stall owner dashboard totals | 2 |
| `v_admin_centre_compare.sql` | stalls within one centre: revenue/grade/peak hours, refund/rating flags | 3 |
| `v_investor_rank.sql` | rank/compare many centres/stalls (takings, cashless %, grade) — read-only | 3 |

Run these AFTER `schema/01_core.sql` + `02_fintech.sql` (+ `03_split.sql`
once Iter 3 views need it).
