-- stalls_many_refunds.sql
-- Owner: LANCEA — Iter 3 nested query
-- Stalls with more reversing ledger refunds than the average live stall
-- in the same centre. Same rule as v_admin_centre_compare.many_refunds.
-- Empty result means no stall is above its centre's average.

SELECT
    s.centre_id,
    s.stall_id,
    s.name AS stall_name,
    COALESCE(r.refund_count, 0) AS refund_count,
    (
        SELECT AVG(COALESCE(r2.refund_count, 0))
        FROM stall s2
        LEFT JOIN (
            SELECT o.stall_id, COUNT(*) AS refund_count
            FROM ledger_entry le
            JOIN orders o ON o.order_id = le.order_id
            WHERE le.entry_type = 'refund'
            GROUP BY o.stall_id
        ) r2 ON r2.stall_id = s2.stall_id
        WHERE s2.centre_id = s.centre_id
          AND s2.is_deleted = 0
    ) AS centre_avg_refunds
FROM stall s
LEFT JOIN (
    SELECT o.stall_id, COUNT(*) AS refund_count
    FROM ledger_entry le
    JOIN orders o ON o.order_id = le.order_id
    WHERE le.entry_type = 'refund'
    GROUP BY o.stall_id
) r ON r.stall_id = s.stall_id
WHERE s.is_deleted = 0
  AND COALESCE(r.refund_count, 0) > 0
  AND COALESCE(r.refund_count, 0) > (
        SELECT AVG(COALESCE(r2.refund_count, 0))
        FROM stall s2
        LEFT JOIN (
            SELECT o.stall_id, COUNT(*) AS refund_count
            FROM ledger_entry le
            JOIN orders o ON o.order_id = le.order_id
            WHERE le.entry_type = 'refund'
            GROUP BY o.stall_id
        ) r2 ON r2.stall_id = s2.stall_id
        WHERE s2.centre_id = s.centre_id
          AND s2.is_deleted = 0
    );
