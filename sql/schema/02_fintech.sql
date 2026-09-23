-- =====================================================
-- 02_fintech.sql
-- Order, payment, and ledger tables.
-- Run after 01_core.sql.
--
-- Checkout (POST /orders/pay) writes these in one transaction,
-- then inserts a matching document in MongoDB payment_events.
-- Wallet balances change only through ledger_entry rows.
-- =====================================================

CREATE TABLE orders (
    order_id        INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    stall_id        INT NOT NULL,
    status          ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL,
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
    unit_price      DECIMAL(10,2) NOT NULL,
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
    order_id        INT,
    entry_type      ENUM('payment','refund') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id),
    CONSTRAINT fk_ledger_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;
