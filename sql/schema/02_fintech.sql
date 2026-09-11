-- =====================================================
-- 02_fintech.sql
-- Owner: LIDEON
-- orders, order_line, payment, ledger_entry
-- Depends on 01_core.sql (stall, menu_item, customer, wallet)
-- =====================================================

CREATE TABLE orders (
    order_id        INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    stall_id        INT NOT NULL,
    status          ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL,             -- TODO Lideon: enforce = SUM(order_line) in app logic (or a trigger)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_orders_stall FOREIGN KEY (stall_id) REFERENCES stall(stall_id),
    CONSTRAINT chk_orders_total CHECK (total_amount > 0)
) ENGINE=InnoDB;

CREATE TABLE order_line (
    order_line_id   INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    menu_item_id    INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,             -- snapshot of menu_item.price at order time
    CONSTRAINT fk_order_line_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT fk_order_line_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id),
    CONSTRAINT chk_order_line_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_line_price CHECK (unit_price > 0)
) ENGINE=InnoDB;

CREATE TABLE payment (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL UNIQUE,
    method          ENUM('paynow','card','cash') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    paid_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT chk_payment_amount CHECK (amount > 0)
) ENGINE=InnoDB;

CREATE TABLE ledger_entry (
    ledger_entry_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id       INT NOT NULL,
    order_id        INT,                                -- NULL only for a non-order adjustment, if that ever exists
    entry_type      ENUM('payment','refund') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,              -- signed: a refund is a reversing (negative-of-payment) row
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id),
    CONSTRAINT fk_ledger_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
    -- RULE: never DELETE from this table. A refund = a new reversing row, not a deleted row.
) ENGINE=InnoDB;

-- =====================================================
-- TODO Lideon — the actual "pay" flow (application code, not DDL):
--
--   START TRANSACTION;
--     INSERT INTO orders (...);
--     INSERT INTO order_line (...)   -- one row per cart item
--     INSERT INTO payment (...);
--     INSERT INTO ledger_entry (...);
--     UPDATE wallet SET balance = balance - :amount WHERE wallet_id = :id;  -- the ONLY place balance changes
--   COMMIT;
--   -- only AFTER commit succeeds: insert the matching Mongo payment_event (Wileen owns the collection, you glue the call)
--
-- Refund (Iter 3): reverse via a new ledger_entry (entry_type='refund'),
-- never DELETE the original row. Append a matching Mongo refund event too.
-- =====================================================
