# ETL run order — Owner: LIDEON (this file); scripts split across Lancea/Lideon/Wileen

1. **Official data load** (Lancea) — after `sql/schema/01_core.sql` has run
   ```bash
   python etl/scripts/load_centres_stalls.py
   python etl/scripts/load_prices.py
   ```
2. **Generate SQL money data** (Lideon) — after `02_fintech.sql` has run
   ```bash
   python etl/scripts/generate_orders.py
   ```
3. **Generate Mongo events** (Wileen) — after step 2, so order_ids exist
   ```bash
   python etl/scripts/generate_mongo_events.py
   ```

Raw downloads go in `etl/raw/` (gitignored — note the download date in
`etl/raw/README.md` instead of committing the files).
