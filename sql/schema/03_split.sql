-- =====================================================
-- 03_split.sql
-- Group bill split. Run after 01_core.sql and 02_fintech.sql.
-- Makan split (YouTrip-style): one diner already paid the stall.
-- share_amount is what each friend owes the organizer — settle
-- wallet → organizer, not extra stall checkouts.
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- =====================================================

CREATE TABLE IF NOT EXISTS dining_session (
    session_id      INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL UNIQUE,
    split_type      ENUM('equal','by_item','custom') NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS session_member (
    session_member_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id        INT NOT NULL,
    customer_id       INT NOT NULL,
    share_amount      DECIMAL(10,2) NOT NULL,
    is_settled        TINYINT(1) NOT NULL DEFAULT 0,
    settled_at        TIMESTAMP NULL,
    CONSTRAINT fk_session_member_session FOREIGN KEY (session_id) REFERENCES dining_session(session_id),
    CONSTRAINT fk_session_member_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT chk_session_member_share CHECK (share_amount > 0),
    CONSTRAINT uq_session_member UNIQUE (session_id, customer_id)
) ENGINE=InnoDB;

ALTER TABLE session_member
    ADD COLUMN IF NOT EXISTS is_settled TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP NULL;

-- Friend settle is a ledger movement, not a stall payment/refund.
ALTER TABLE ledger_entry
    MODIFY COLUMN entry_type ENUM('payment','refund','split_settle') NOT NULL;

-- settled_at is set exactly when is_settled = 1 (organizer row is
-- inserted already settled; settle sets both together).
ALTER TABLE session_member
    ADD CONSTRAINT IF NOT EXISTS chk_session_member_settled CHECK (
        (is_settled = 0 AND settled_at IS NULL)
        OR (is_settled = 1 AND settled_at IS NOT NULL)
    );

-- Ledger amounts are stored positive; direction comes from entry_type
-- (and which wallet). A refund is a new reversing row, never a negative edit.
ALTER TABLE ledger_entry
    ADD CONSTRAINT IF NOT EXISTS chk_ledger_amount CHECK (amount > 0);
