-- v_owner_takings.sql
-- Owner: LANCEA — Iter 2
-- One row per live stall for the owner dashboard. Today’s figures are 0
-- when that stall has no paid orders yet (empty state, not fake numbers).

CREATE OR REPLACE VIEW v_owner_takings AS
SELECT
    s.stall_id,
    s.name AS stall_name,
    s.centre_id,
    c.name AS centre_name,
    s.cuisine_type,
    s.grade,
    COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN o.total_amount ELSE 0 END), 0)
        AS today_sales,
    CAST(COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS UNSIGNED)
        AS today_orders,
    CASE
        WHEN SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN 1 ELSE 0 END) > 0
        THEN ROUND(
            SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN o.total_amount ELSE 0 END)
            / SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN 1 ELSE 0 END),
            2
        )
        ELSE NULL
    END AS today_avg_ticket,
    COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() AND p.method = 'cash' THEN p.amount ELSE 0 END), 0)
        AS cash_today,
    COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() AND p.method IN ('paynow', 'card') THEN p.amount ELSE 0 END), 0)
        AS cashless_today
FROM stall s
JOIN hawker_centre c ON c.centre_id = s.centre_id
LEFT JOIN orders o ON o.stall_id = s.stall_id AND o.status = 'paid'
LEFT JOIN payment p ON p.order_id = o.order_id
WHERE s.is_deleted = 0
GROUP BY s.stall_id, s.name, s.centre_id, c.name, s.cuisine_type, s.grade;
