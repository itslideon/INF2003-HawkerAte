-- Camera check for Makan split (Lideon). Swap the ids after a fresh demo pay.
-- Expect: one payment row; ledger payment + split_settle pairs; three wallets.

SET @order_id := 204;
SET @session_id := 1;

SELECT COUNT(*) AS payments FROM payment WHERE order_id = @order_id;

SELECT entry_type, wallet_id, amount
FROM ledger_entry
WHERE order_id = @order_id
ORDER BY ledger_entry_id;

SELECT sm.customer_id, sm.share_amount, sm.is_settled, sm.settled_at, w.balance
FROM session_member sm
JOIN wallet w ON w.customer_id = sm.customer_id
WHERE sm.session_id = @session_id
ORDER BY sm.session_member_id;
