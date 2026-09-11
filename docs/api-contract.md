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
