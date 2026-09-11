# Aggregations — Owner: WILEEN

Planned pipelines (build the actual `.aggregate([...])` code in each file):

- `by_stall.js` — total amount & count of payment_events per stall_id
- `by_method_hour.js` — sums grouped by method (paynow/card/cash) and hour of day
- `review_search.js` — text search over `reviews.comment` for a stall

Iter 3 adds:
- `cash_vs_cashless_mix.js` — feeds Lancea's cash-vs-cashless analytics
- `peak_hours.js`
