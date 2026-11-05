-- stalls_below_centre_avg_ticket.sql
-- Owner: LANCEA — Iter 3 extra-credit nested query
-- Stalls whose average paid ticket is below their own centre's average.
-- A stall with no paid orders is left out (there is no average to compare).
-- An empty result means every stall with sales is at or above its centre.

SELECT
    s.centre_id,
    c.name AS centre_name,
    s.stall_id,
    s.name AS stall_name,
    ROUND(AVG(o.total_amount), 2) AS stall_avg_ticket,
    (
        SELECT ROUND(AVG(o2.total_amount), 2)
        FROM orders o2
        JOIN stall s2 ON s2.stall_id = o2.stall_id
        WHERE s2.centre_id = s.centre_id
          AND s2.is_deleted = 0
          AND o2.status = 'paid'
    ) AS centre_avg_ticket
FROM stall s
JOIN hawker_centre c ON c.centre_id = s.centre_id
JOIN orders o ON o.stall_id = s.stall_id AND o.status = 'paid'
WHERE s.is_deleted = 0
GROUP BY s.centre_id, c.name, s.stall_id, s.name
HAVING AVG(o.total_amount) < (
    SELECT AVG(o2.total_amount)
    FROM orders o2
    JOIN stall s2 ON s2.stall_id = o2.stall_id
    WHERE s2.centre_id = s.centre_id
      AND s2.is_deleted = 0
      AND o2.status = 'paid'
);
