# Data load

Order matters: schema first, then official hawker data, then generated orders, then Mongo events.

1. After `sql/schema/01_core.sql`, put the NEA extracts in `etl/raw/` (gitignored). Download from data.gov.sg (same ids as `etl/raw/README.md`):

- Hawker centres CSV: dataset `d_68a42f09f350881996d83f9cd73ab02f` → save as `etl/raw/d_68a42f09f350881996d83f9cd73ab02f.csv`
- Hawker centres GeoJSON: dataset `d_4a086da0a5553be1d89383cd90d07ecd` → save as `etl/raw/d_4a086da0a5553be1d89383cd90d07ecd.geojson`

Open-data poll URL (then GET the `data.url` it returns):

```
https://api-open.data.gov.sg/v1/public/api/datasets/<dataset_id>/poll-download
```

Then:

```bash
python etl/scripts/load_centres_stalls.py
python etl/scripts/load_prices.py
```

`load_centres_stalls.py` inserts every NEA centre, then seeds **at most 8 stalls per centre** from cooked-food counts (temporary names `Stall 1` …). Centres that **already have a stall** are skipped — so if you ran `test_inserts.sql` first, Maxwell stays the single **Rice** stall and the other ~106 centres still fill. GeoJSON updates lat/lng where names match.

`load_prices.py` assigns a cuisine in rotation (Chinese / Malay / Indian / Western / Drinks) and inserts that cuisine’s 9 dishes, prices scaled by the hawker-centre CPI series. It then renames `Stall N` to a hawker-style name that matches the cuisine (e.g. Golden Wok, Satay Hut, Prata House). Re-run is safe: existing dish names stay; already-named stalls such as **Rice** are not overwritten.

A full load looks like **107 centres**, **~828–835 stalls**, **~7.4k–7.5k menu items** (Maxwell with Rice vs Maxwell with 8 NEA stalls is why two machines can differ by a few stalls).

2. After `sql/schema/02_fintech.sql` (and `04_queue.sql` so tickets can enqueue):

```bash
python etl/scripts/generate_orders.py
python etl/scripts/generate_orders.py 500
```

Default is **2000** orders (Iter 3 thousands). Same pay rules as `POST /orders/pay`: one SQL transaction each, wallet only via `ledger_entry`. Pass a number to override. Do **not** default to 50k — that is Iter 4. The CSV is overwritten each run (`etl/raw/generated_orders.csv`, gitignored). After a big run, Wileen re-runs `generate_mongo_events.py` so reconcile can match.

`created_at` is stored UTC but **picked in Singapore time**: bigger lunch rush 12:00–14:00, smaller dinner 18:00–20:00, light traffic the rest of 07:00–21:00. That is so Mongo payments-by-hour is not one spike. Old rows keep their old timestamps until you generate new ones.

3. Then, so Mongo has a matching event for every generated order:

```bash
python etl/scripts/generate_mongo_events.py
```

Put downloaded CSVs / GeoJSON in `etl/raw/` (that folder is gitignored). Note the download date in `etl/raw/README.md` instead of committing the files.

`load_prices.py` pulls a slim SingStat CPI extract (`singstat_cpi.csv`) if it is missing, then scales hawker dish prices by the **Hawker Centres** index (2024=100).

`generate_orders.py` picks `method` with this hawker-demo mix (MAS national stats are not stall-level PayNow; hawkers stay a bit more cash than overall retail):

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