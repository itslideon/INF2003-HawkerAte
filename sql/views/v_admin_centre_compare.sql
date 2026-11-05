-- v_admin_centre_compare.sql
-- Owner: LANCEA — Iter 3
-- One row per live stall. Filter with WHERE centre_id = ? for one centre.
-- revenue / avg_ticket count paid orders only. No paid orders → revenue 0,
-- avg_ticket NULL, peak_hour NULL. Do not invent totals in the UI.
--
-- refund_count is reversing ledger_entry rows (entry_type = 'refund'),
-- not deleted payments.
-- many_refunds is 1 when this stall has more refunds than the average
-- live stall in the same centre (and at least one refund).
--
-- Ratings are not in MariaDB. GET /centres/:id/admin-summary adds
-- avg_rating / low_rating from Mongo reviews (same stall_id).

CREATE OR REPLACE VIEW v_admin_centre_compare AS
SELECT
    s.centre_id,
    s.stall_id,
    s.name AS stall_name,
    s.grade,
    s.cuisine_type,
    COALESCE(sales.revenue, 0) AS revenue,
    sales.avg_ticket,
    COALESCE(sales.order_count, 0) AS order_count,
    peak.peak_hour,
    COALESCE(refunds.refund_count, 0) AS refund_count,
    CASE
        WHEN COALESCE(refunds.refund_count, 0) > 0
         AND COALESCE(refunds.refund_count, 0) > COALESCE(centre_refunds.avg_refunds, 0)
        THEN 1
        ELSE 0
    END AS many_refunds
FROM stall s
LEFT JOIN (
    SELECT
        o.stall_id,
        SUM(o.total_amount) AS revenue,
        ROUND(AVG(o.total_amount), 2) AS avg_ticket,
        COUNT(o.order_id) AS order_count
    FROM orders o
    WHERE o.status = 'paid'
    GROUP BY o.stall_id
) sales ON sales.stall_id = s.stall_id
LEFT JOIN (
    SELECT stall_id, peak_hour
    FROM (
        SELECT
            stall_id,
            hr AS peak_hour,
            ROW_NUMBER() OVER (
                PARTITION BY stall_id
                ORDER BY cnt DESC, hr ASC
            ) AS rn
        FROM (
            SELECT
                stall_id,
                HOUR(created_at) AS hr,
                COUNT(*) AS cnt
            FROM orders
            WHERE status = 'paid'
            GROUP BY stall_id, HOUR(created_at)
        ) hours
    ) ranked
    WHERE rn = 1
) peak ON peak.stall_id = s.stall_id
LEFT JOIN (
    SELECT
        o.stall_id,
        COUNT(*) AS refund_count
    FROM ledger_entry le
    JOIN orders o ON o.order_id = le.order_id
    WHERE le.entry_type = 'refund'
    GROUP BY o.stall_id
) refunds ON refunds.stall_id = s.stall_id
LEFT JOIN (
    SELECT
        s2.centre_id,
        AVG(COALESCE(r.refund_count, 0)) AS avg_refunds
    FROM stall s2
    LEFT JOIN (
        SELECT
            o.stall_id,
            COUNT(*) AS refund_count
        FROM ledger_entry le
        JOIN orders o ON o.order_id = le.order_id
        WHERE le.entry_type = 'refund'
        GROUP BY o.stall_id
    ) r ON r.stall_id = s2.stall_id
    WHERE s2.is_deleted = 0
    GROUP BY s2.centre_id
) centre_refunds ON centre_refunds.centre_id = s.centre_id
WHERE s.is_deleted = 0;
