# API

The UI talks to the Flask app in `backend/`. Field names match the MariaDB columns (`centre_id`, `stall_id`, and so on). Mongo stores those same ids as strings. If an endpoint isn’t implemented yet, the UI shows an empty state instead of making up numbers.

## Browse

```
GET /centres
  → [{ centre_id, name, address, postal_code, latitude, longitude }]

GET /centres/:id/stalls
  → [{ stall_id, name, cuisine_type, grade }]

GET /stalls/:id/menu
  → [{ menu_item_id, name, price, is_available }]
```

## Reviews

```
GET /stalls/:id/reviews
  → { average_rating, review_count, reviews: [{ customer_id, rating, comment, created_at }] }

POST /reviews
  body: { stall_id, customer_id, rating, comment }
  → { ok, id, stall_id, customer_id, rating }
```

`rating` is 1–5. Soft-deleted reviews are left out of the GET.

## Checkout

```
POST /orders/pay
  body: { customer_id, stall_id, items: [{ menu_item_id, quantity }], method }
  → { order_id, status, total_amount, mongo_written }
```

`method` is `paynow`, `card`, or `cash`. Totals come from menu prices in MariaDB. After the SQL commit succeeds, a `payment_events` document is inserted in Mongo.

## Later

```
POST /orders/:id/refund
POST /dining-sessions
GET  /centres/:id/admin-summary
GET  /investor/rank
```
