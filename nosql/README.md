# MongoDB

Database name: **`hawkerate`**.

We’re using MongoDB Atlas (free tier). Local `mongod` also works.

### Atlas

Prefer the existing **HawkerAte** project cluster. Do not create a second cluster.

1. Accept the project invite and sign in as yourself.
2. **Database Access:** use *your* database user (SCRAM). Edit that user to set a password you know. This is not the Atlas website login.
3. **Network Access:** add this machine’s IP (or `0.0.0.0/0` if the group agrees). An SSL handshake error from the API usually means the IP is missing. `bad auth` means the URI user/password does not match Database Access.
4. Copy `.env.example` to `.env` at the repo root (one line, no space after `=`):

```
MONGO_URI=mongodb+srv://<database-user>:<password>@<cluster>.mongodb.net/?appName=HawkerAte
MONGO_DB=hawkerate
```

Keep `.env` off git. If the password contains `@`, `#`, `%`, or `/`, URL-encode it.

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
