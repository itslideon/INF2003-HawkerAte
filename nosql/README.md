# MongoDB setup — Owner: WILEEN (works with Tanvi on shared MariaDB IDs)

DB name: **`hawkerate`** — pick once, never rename.

## Start Mongo

```bash
mongod --dbpath <your data dir>
# or: brew services start mongodb-community
# or: docker run -d -p 27017:27017 --name hawkerate-mongo mongo
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
