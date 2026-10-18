-- Stall queue. Run after 02_fintech.sql (needs stall + orders).
-- Operational line, not money: ticket_no grows per stall; now serving is MIN(ticket_no).
-- Pay inserts a row in the same transaction as the order. Ready/refund removes it.

CREATE TABLE stall_queue (
    queue_id        INT AUTO_INCREMENT PRIMARY KEY,
    stall_id        INT NOT NULL,
    order_id        INT NOT NULL UNIQUE,
    ticket_no       INT NOT NULL,
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_queue_stall FOREIGN KEY (stall_id) REFERENCES stall(stall_id),
    CONSTRAINT fk_queue_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT chk_queue_ticket CHECK (ticket_no > 0),
    CONSTRAINT uq_queue_stall_ticket UNIQUE (stall_id, ticket_no)
) ENGINE=InnoDB;
