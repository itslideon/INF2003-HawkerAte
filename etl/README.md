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

3. Then, so Mongo can reuse those order ids:

```bash
python etl/scripts/generate_mongo_events.py
```

Put downloaded CSVs / GeoJSON in `etl/raw/` (that folder is gitignored). Note the download date in `etl/raw/README.md` instead of committing the files.

`generate_orders.py` writes `etl/raw/generated_orders.csv` with:

```
order_id,stall_id,customer_id,amount,method
```

`generate_mongo_events.py` reads that file and inserts one `payment_events` document per row.
