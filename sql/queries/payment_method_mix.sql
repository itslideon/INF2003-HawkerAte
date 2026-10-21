-- payment_method_mix.sql
-- Owner: LANCEA — Iter 2
-- Actual paid mix vs the MAS-inspired demo targets used when generating orders.
-- Official MAS stats are national retail mix, not stall-level PayNow.
-- Hawker demo targets (for generate_orders.py, not live bank data):
--   paynow 45% / card 20% / cash 35%
-- Source: https://www.mas.gov.sg/statistics/payment-statistics/semi-annual-retail-payment-statistics
--
-- Empty result if there are no paid orders yet.

SELECT
    p.method,
    COUNT(*) AS payment_count,
    SUM(p.amount) AS sales_total,
    ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_of_payments
FROM payment p
JOIN orders o ON o.order_id = p.order_id AND o.status = 'paid'
GROUP BY p.method
ORDER BY p.method;
