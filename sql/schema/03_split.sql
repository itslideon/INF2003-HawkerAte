-- =====================================================
-- 03_split.sql
-- Group bill split. Run after 01_core.sql and 02_fintech.sql.
-- share_amount is the amount each person owes; they pay through
-- the normal checkout path.
-- =====================================================

CREATE TABLE dining_session (
    session_id      INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    split_type      ENUM('equal','by_item','custom') NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

CREATE TABLE session_member (
    session_member_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id        INT NOT NULL,
    customer_id       INT NOT NULL,
    share_amount      DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_session_member_session FOREIGN KEY (session_id) REFERENCES dining_session(session_id),
    CONSTRAINT fk_session_member_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT chk_session_member_share CHECK (share_amount > 0)
) ENGINE=InnoDB;
