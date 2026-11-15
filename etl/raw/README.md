# Raw data

Downloaded NEA / SingStat files live here and stay off git. The loaders look for these **exact filenames**.

How to get them:

1. Open [data.gov.sg](https://data.gov.sg) and search the dataset id, **or** call  
   `https://api-open.data.gov.sg/v1/public/api/datasets/<id>/poll-download`  
   then download the URL in `data.url`.
2. Save into this folder using the names below.

| File | Dataset | Notes |
|------|---------|--------|
| `d_68a42f09f350881996d83f9cd73ab02f.csv` | NEA list of government markets / hawker centres | Needed for `load_centres_stalls.py`. ~107 rows. Columns include `name_of_centre`, `location_of_centre`, `no_of_cooked_food_stalls`. |
| `d_4a086da0a5553be1d89383cd90d07ecd.geojson` | NEA hawker centres GeoJSON | Same script; fills latitude / longitude. |
| `singstat_cpi.csv` | SingStat CPI (2024=100), hawker-centre series `d_bdaff844e3ef89d39fceb962ff8f0791` | Optional to download by hand — `load_prices.py` writes this if it is missing. |
| `generated_orders.csv` | written by `generate_orders.py` | Not an official dump. Used by `generate_mongo_events.py`. |

Download dates we used: NEA CSV + GeoJSON **2026-11-15** (also pulled 2026-09-29 earlier); CPI extract **2026-10-01** / refreshed by `load_prices.py`.
