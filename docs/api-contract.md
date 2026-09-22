# API

The UI talks to the Flask app in `backend/`. Field names match the MariaDB columns (`centre_id`, `stall_id`, and so on). If an endpoint isn’t implemented yet, the UI shows an empty state instead of making up numbers.

## Browse

```
GET /centres
  → [{ centre_id, name, address, postal_code, latitude, longitude }]

GET /centres/:id/stalls
  → [{ stall_id, name, cuisine_type, grade }]

GET /stalls/:id/menu
  → [{ menu_item_id, name, price, is_available }]
```

These three are what `backend/app.py` serves today.

## Checkout

```
POST /orders/pay
  body: { customer_id, stall_id, items: [{ menu_item_id, quantity }], method }
  → { order_id, status, total_amount }
```

`method` is `paynow`, `card`, or `cash`. `total_amount` comes from the server (sum of line items), not the browser. Not implemented yet.

## Later

```
POST /orders/:id/refund
POST /dining-sessions
GET  /centres/:id/admin-summary
GET  /investor/rank
GET  /stalls/:id/reviews
  → { average_rating, review_count, reviews: [{ customer_id, rating, comment, created_at }] }
```

Reviews live in Mongo (`nosql/`). Averages ignore documents with `is_deleted: true`.
