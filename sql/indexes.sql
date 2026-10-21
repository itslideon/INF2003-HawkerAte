-- indexes.sql
-- Owner: LANCEA — Iter 2
-- Speeds owner/settlement views and pay/queue lookups.
-- Safe to re-run (IF NOT EXISTS). Apply after 02_fintech.sql and 04_queue.sql.

CREATE INDEX IF NOT EXISTS idx_orders_stall_created
    ON orders (stall_id, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
    ON orders (status, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_method
    ON payment (method);

CREATE INDEX IF NOT EXISTS idx_menu_item_stall
    ON menu_item (stall_id);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet
    ON ledger_entry (wallet_id);

CREATE INDEX IF NOT EXISTS idx_stall_centre_deleted
    ON stall (centre_id, is_deleted);

CREATE INDEX IF NOT EXISTS idx_queue_stall_ticket
    ON stall_queue (stall_id, ticket_no);
