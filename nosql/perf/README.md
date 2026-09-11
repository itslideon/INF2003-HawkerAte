# Speed test — Owner: WILEEN + LIDEON (Iter 4)

Duplicate ONE read (not the whole ledger) on SQL vs Mongo and time it —
e.g. "today's payment total for one stall" computed via a MariaDB view
vs. an equivalent Mongo aggregation on `payment_events`.

TODO: `speed_test.py` or `speed_test.js` — run both N times, record
min/avg/max latency, write results into this folder as `results.md`.
