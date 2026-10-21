-- v_daily_settlement.sql
-- Owner: LANCEA — Iter 2
-- Today's (and any day's) paid sales per stall: count, total, avg ticket,
-- cuisine-level avg ticket, cash vs PayNow vs card. Kristen filters with
--   WHERE order_date = CURDATE()
-- Empty result = no paid orders that day. Do not invent totals in the UI.

CREATE OR REPLACE VIEW v_daily_settlement AS
SELECT
    s.stall_id,
    s.name AS stall_name,
    s.cuisine_type,
    DATE(o.created_at) AS order_date,
    COUNT(o.order_id) AS order_count,
    SUM(o.total_amount) AS sales_total,
    ROUND(AVG(o.total_amount), 2) AS avg_ticket,
    ROUND(cuisine.avg_ticket, 2) AS cuisine_avg_ticket,
    SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END) AS cash_sales,
    SUM(CASE WHEN p.method = 'paynow' THEN p.amount ELSE 0 END) AS paynow_sales,
    SUM(CASE WHEN p.method = 'card' THEN p.amount ELSE 0 END) AS card_sales
FROM stall s
JOIN orders o ON o.stall_id = s.stall_id AND o.status = 'paid'
JOIN payment p ON p.order_id = o.order_id
JOIN (
    SELECT
        DATE(o2.created_at) AS order_date,
        s2.cuisine_type,
        AVG(o2.total_amount) AS avg_ticket
    FROM stall s2
    JOIN orders o2 ON o2.stall_id = s2.stall_id AND o2.status = 'paid'
    WHERE s2.is_deleted = 0
    GROUP BY DATE(o2.created_at), s2.cuisine_type
) cuisine
    ON cuisine.order_date = DATE(o.created_at)
   AND cuisine.cuisine_type = s.cuisine_type
WHERE s.is_deleted = 0
GROUP BY
    s.stall_id,
    s.name,
    s.cuisine_type,
    DATE(o.created_at),
    cuisine.avg_ticket;
