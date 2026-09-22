# MongoDB setup — Owner: WILEEN (works with Tanvi on shared MariaDB IDs)

DB name: **`hawkerate`** — pick once, never rename.

## Start Mongo

Using **MongoDB Atlas** (free tier — what this project uses):

1. Sign up / log in at mongodb.com, create a free (M0) cluster.
2. Database Access → add a user + password.
3. Network Access → allow your current IP (or `0.0.0.0/0` for a class
   project shared across teammates' laptops).
4. Get the connection string (Atlas UI → Connect → Drivers), then copy
   `.env.example` to `.env` at the repo root and set:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
   MONGO_DB=hawkerate
   ```

Or run it locally instead:

```bash
mongod --dbpath <your data dir>
# or: brew services start mongodb-community
# or: docker run -d -p 27017:27017 --name hawkerate-mongo mongo
```
(then `MONGO_URI=mongodb://localhost:27017` in `.env`)

## Python setup

```bash
pip install -r nosql/requirements.txt
python nosql/db.py               # sanity check: prints the connection + collection list
python nosql/setup_collections.py  # creates collections with $jsonSchema validators + indexes
python nosql/seed.py               # inserts the example docs from nosql/models/
```

## Collections

- `payment_events` — one doc per pay/refund event, inserted **after** the
  matching MariaDB transaction commits. PayNow/card/cash have different
  fields (see `models/payment_events.example.json`).
- `reviews` — soft-delete (`is_deleted`), searchable by stall.
- `investor_watchlist` (optional).

## Rules

- Mongo collections are **not** part of the "9 SQL table" minimum — they're
  the separate NoSQL half of the project.
- Insert `payment_events` only after the SQL commit succeeds.
- Refunds are **appended** as new events, never rewritten or deleted
  (append-only, same principle as the SQL ledger).
- Do not duplicate the whole SQL ledger here — just the event log.
- Keep field names (`stall_id`, `order_id`, `customer_id`, ...) exactly in
  sync with the MariaDB column names Tanvi/Lideon use — agree in writing.
