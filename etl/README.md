# Data load

Order matters: schema first, then official hawker data, then generated orders, then Mongo events.

1. After `sql/schema/01_core.sql`:

```bash
python etl/scripts/load_centres_stalls.py
python etl/scripts/load_prices.py
```

2. After `sql/schema/02_fintech.sql`:

```bash
python etl/scripts/generate_orders.py
```

3. Then, so Mongo has a matching event for every generated order:

```bash
python etl/scripts/generate_mongo_events.py
```

Put downloaded CSVs / GeoJSON in `etl/raw/` (that folder is gitignored). Note the download date in `etl/raw/README.md` instead of committing the files.

`load_prices.py` pulls a slim SingStat CPI extract (`singstat_cpi.csv`) if it is missing, then scales hawker dish prices by the **Hawker Centres** index (2024=100).

When `generate_orders.py` exists, pick `method` with this hawker-demo mix (MAS national stats are not stall-level PayNow; hawkers stay a bit more cash than overall retail):

- `paynow` 45%
- `card` 20%
- `cash` 35%

Check actual mix later with `sql/queries/payment_method_mix.sql`.

## Generated orders and Mongo events

Generated orders are inserted straight into MariaDB, so they skip the `/orders/pay` route that normally writes the Mongo event. That is why step 3 exists.

`generate_orders.py` writes `etl/raw/generated_orders.csv` with:

```
order_id,stall_id,customer_id,amount,method,created_at
```

- `method` is lowercase `paynow`, `card` or `cash` (demo mix about 45% / 20% / 35%, not real bank data)
- `created_at` is an ISO time in UTC, e.g. `2026-10-21T04:10:00Z` (optional; if it is missing, the load time is used)
- one row per order that was committed to MariaDB

`generate_mongo_events.py` reads that file and inserts one `payment_events` document per row. IDs are stored as strings (`"1"`, `"2"`) to match the Mongo schema. It is safe to re-run: orders that already have an event are skipped. To load a different file: `python etl/scripts/generate_mongo_events.py path/to/file.csv`.

### Check that SQL and Mongo agree

With the backend running:

```bash
curl http://localhost:3000/analytics/payments/reconcile
```

`"all_match": true` means every stall has the same total and the same number of payments in MariaDB and Mongo.

### If you wipe or regenerate orders

Keep both sides in step. If the MariaDB orders are cleared or regenerated, clear `payment_events` in Mongo too and reload it from the new CSV, otherwise `reconcile` will show a mismatch.