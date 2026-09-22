# API contract — frontend (Kristen) ↔ backend (Lideon)

Update this file in the same PR as the endpoint it documents. Kristen
must not invent totals/queue positions/etc. — if a field isn't in this
contract yet, show a waiting/empty state instead of a fake number.

## Iter 1 — reads only

```
GET /centres
  -> [{ centre_id, name, address, postal_code, latitude, longitude }]

GET /centres/:id/stalls
  -> [{ stall_id, name, cuisine_type, grade }]

GET /stalls/:id/menu
  -> [{ menu_item_id, name, price, is_available }]
```

## Iter 2 — pay path

```
POST /orders/pay
  body: { customer_id, stall_id, items: [{ menu_item_id, quantity }], method }
  -> { order_id, status, total_amount, queue_position }
```

`total_amount` and `queue_position` come from this response only —
never computed client-side.

## Iter 3 — split / refund / admin / investor

```
POST /orders/:id/refund
POST /dining-sessions            (friend split: equal / by_item / custom)
GET  /centres/:id/admin-summary  (one centre — revenue/grade/peak hours/flags)
GET  /investor/rank              (read-only, many centres/stalls)
```

TODO Lideon: confirm exact response shapes as each endpoint ships.

## Reviews — DRAFT, not built yet

Wileen has pushed `nosql/` (`reviews` collection, string `stall_id` — see
`nosql/setup_collections.py` and `nosql/aggregations/`), but there's no
HTTP endpoint over it yet, only Python/mongosh scripts that talk to Mongo
directly. The frontend needs one to replace the stall rating it currently
shows (`frontend/src/components/StallRating.jsx`, wired to the shape
below via `frontend/src/lib/reviewsApi.js`) — right now that component
gets `null` from every request and renders nothing.

Proposed shape, for Lideon to confirm/adjust when he builds it:

```
GET /stalls/:id/reviews
  -> { average_rating, review_count, reviews: [{ customer_id, rating, comment, created_at }] }
```

`average_rating`/`review_count` come from aggregating non-deleted
`reviews` docs for that `stall_id` (see `nosql/aggregations/by_stall.js`
for the aggregation pattern, applied to `reviews` instead of
`payment_events`).
