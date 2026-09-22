# Views

Run these after `schema/01_core.sql` and `schema/02_fintech.sql`. Split-related views also need `03_split.sql`.

| File | What it’s for |
|------|----------------|
| `v_daily_settlement.sql` | Daily sales, average ticket by cuisine, cash vs PayNow |
| `v_owner_takings.sql` | Totals for a stall owner dashboard |
| `v_admin_centre_compare.sql` | Stalls in one centre: revenue, grade, peak hours, flags |
| `v_investor_rank.sql` | Compare centres / stalls (takings, cashless %, grade) |
