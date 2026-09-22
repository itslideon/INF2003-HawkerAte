# MongoDB

Database name: **`hawkerate`**.

We’re using MongoDB Atlas (free tier). Local `mongod` also works.

### Atlas

1. Create a free M0 cluster at mongodb.com.
2. Add a database user.
3. Allow your IP under Network Access (or `0.0.0.0/0` if everyone’s laptops need it).
4. Copy `.env.example` to `.env` at the repo root:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
MONGO_DB=hawkerate
```

Keep `.env` off git.

### Local

```bash
mongod --dbpath <your data dir>
```

Then `MONGO_URI=mongodb://localhost:27017` in `.env`.

## Python scripts

```bash
pip install -r nosql/requirements.txt
python nosql/db.py
python nosql/setup_collections.py
python nosql/seed.py
```

`setup_collections.py` creates the collections with validators and indexes. `seed.py` loads the example docs under `nosql/models/`.

## Collections

- `payment_events` — one document per pay or refund, written after the matching MariaDB commit. PayNow / card / cash don’t all have the same fields (see the example JSON).
- `reviews` — stall ratings; soft-deleted with `is_deleted`.
- `investor_watchlist` — optional.

This is the NoSQL side of the project, not a copy of the SQL ledger. Field names like `stall_id` / `order_id` match the MariaDB columns, stored as strings (`"1"` for id `1`).
