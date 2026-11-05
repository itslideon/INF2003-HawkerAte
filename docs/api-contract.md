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
  → { order_id, status, total_amount, mongo_written, queue }
```

`method` is `paynow`, `card`, or `cash`. Totals come from menu prices in MariaDB. After the SQL commit succeeds, a `payment_events` document is inserted in Mongo.

`queue` is `{ ticket_no, ahead, now_serving_ticket, stall_id, order_id, in_queue }`. Needs `sql/schema/04_queue.sql`. Line is table `stall_queue`, not a column on `orders`.

## Queue

```
GET /stalls/:id/queue
  → { stall_id, now_serving_ticket, waiting, line: [{ order_id, ticket_no, customer_id }] }

GET /orders/:id/queue
  → { in_queue, ticket_no, ahead, now_serving_ticket, … } or { in_queue: false }

POST /orders/:id/ready
  → { ok, order_id, in_queue: false }
```

`now_serving_ticket` is the smallest `ticket_no` still in that stall’s line. `ahead` is how many tickets are smaller than yours. `POST …/ready` removes the order from the line (food collected). Refund should do the same when that endpoint exists.

## Owner (MariaDB views)

Needs `sql/views/v_owner_takings.sql` and `v_daily_settlement.sql`. Totals are SQL SUMs. If a stall has no paid orders today, takings are `0`, not a placeholder.

```
GET /stalls/:id/takings
  → { stall_id, stall_name, centre_id, centre_name, cuisine_type, grade,
      today_sales, today_orders, today_avg_ticket, cash_today, cashless_today }

GET /settlement
GET /settlement?date=YYYY-MM-DD
  → { date, stalls: [{ stall_id, stall_name, cuisine_type, order_date,
      order_count, sales_total, avg_ticket, cuisine_avg_ticket,
      cash_sales, paynow_sales, card_sales }] }
```

Omit `date` for `CURDATE()`. Empty `stalls: []` means no paid orders that day.

## Centre admin (MariaDB view + Mongo ratings)

Needs `sql/views/v_admin_centre_compare.sql`. Money columns are SQL. A stall with no paid orders has `revenue` 0, `avg_ticket` null, and `peak_hour` null.

`avg_rating` and `low_rating` come from Mongo `reviews` (`stall_id` as a string, soft-deleted rows left out). `low_rating` is 1 when the average is below 3. If that stall has no reviews, `avg_rating` is null and `low_rating` is 0. If Mongo is down, `ratings_available` is false and those three rating fields are null.

`peak_hour` is 0–23. `many_refunds` is 1 when the stall has more refund ledger rows than the average live stall in that centre.

```
GET /centres/:id/admin-summary
  → { centre_id, centre_name, ratings_available,
      stalls: [{ stall_id, stall_name, grade, cuisine_type,
        revenue, avg_ticket, order_count, peak_hour,
        refund_count, many_refunds,
        avg_rating, review_count, low_rating }] }
```

Stalls are ordered by `revenue` descending. Unknown centre → 404. A real centre with no live stalls → `stalls: []`.

## Investor (read-only MariaDB view)

Needs `sql/views/v_investor_rank.sql`. Takings are the sum of `payment.amount` on paid orders. `cashless_pct` is PayNow + card as a percent of that sum, or null when takings are 0. Grades with no SFA letter are left out of the average, so `avg_grade` is null until grades are loaded. `avg_grade_score` is A=4 … D=1.

```
GET /investor/rank
  → { centres: [{ centre_id, centre_name, stall_count,
      total_takings, cashless_pct, avg_grade_score, avg_grade }] }
```

Ordered by `total_takings` descending. This route does not write anything.

## Later

```
POST /orders/:id/refund
POST /dining-sessions
```
