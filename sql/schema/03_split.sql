-- =====================================================
-- 03_split.sql
-- Owner: LIDEON — Iter 3 (friend split, 3 diners demo)
-- dining_session, session_member
-- Depends on 02_fintech.sql (orders) and 01_core.sql (customer)
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

-- TODO Lideon (Iter 3): split-calculation logic (equal / by-item / custom)
-- lives in application code — each session_member row just records the
-- final share_amount once it's computed, and each member pays their own
-- share through the normal pay path.
