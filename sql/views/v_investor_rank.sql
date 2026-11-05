-- v_investor_rank.sql
-- Owner: LANCEA — Iter 3
-- One row per hawker centre. Read-only: rank in the API with
-- ORDER BY total_takings DESC. Do not invent takings in the UI.
--
-- total_takings is the sum of payment amounts on paid orders.
-- cashless_pct is paynow + card as a percent of that sum
-- (NULL when the centre has no paid orders).
-- avg_grade_score maps A=4, B=3, C=2, D=1 and ignores stalls with no grade.
-- avg_grade is that score rounded to the nearest letter (3.5+ → A).

CREATE OR REPLACE VIEW v_investor_rank AS
SELECT
    c.centre_id,
    c.name AS centre_name,
    COUNT(s.stall_id) AS stall_count,
    COALESCE(SUM(sales.takings), 0) AS total_takings,
    CASE
        WHEN COALESCE(SUM(sales.takings), 0) = 0 THEN NULL
        ELSE ROUND(100 * COALESCE(SUM(sales.cashless), 0) / SUM(sales.takings), 1)
    END AS cashless_pct,
    ROUND(AVG(
        CASE s.grade
            WHEN 'A' THEN 4
            WHEN 'B' THEN 3
            WHEN 'C' THEN 2
            WHEN 'D' THEN 1
        END
    ), 2) AS avg_grade_score,
    CASE
        WHEN AVG(CASE s.grade
            WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1
        END) >= 3.5 THEN 'A'
        WHEN AVG(CASE s.grade
            WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1
        END) >= 2.5 THEN 'B'
        WHEN AVG(CASE s.grade
            WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1
        END) >= 1.5 THEN 'C'
        WHEN AVG(CASE s.grade
            WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1
        END) IS NOT NULL THEN 'D'
        ELSE NULL
    END AS avg_grade
FROM hawker_centre c
LEFT JOIN stall s
    ON s.centre_id = c.centre_id
   AND s.is_deleted = 0
LEFT JOIN (
    SELECT
        o.stall_id,
        SUM(p.amount) AS takings,
        SUM(CASE WHEN p.method IN ('paynow', 'card') THEN p.amount ELSE 0 END) AS cashless
    FROM orders o
    JOIN payment p ON p.order_id = o.order_id
    WHERE o.status = 'paid'
    GROUP BY o.stall_id
) sales ON sales.stall_id = s.stall_id
GROUP BY c.centre_id, c.name;
