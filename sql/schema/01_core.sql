-- =====================================================
-- 01_core.sql
-- Owner: TANVI  (does NOT own pay txns / Mongo / UI)
-- Core entities: hawker_centre, stall, menu_item, customer, wallet
-- Relationships: centre 1-M stall; stall 1-M menu_item; customer 1-1 wallet
-- Do NOT add order/payment/ledger columns here — those live in
-- Lideon's 02_fintech.sql. Leave the boxes empty for him.
-- =====================================================

CREATE TABLE hawker_centre (
    centre_id       INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    postal_code     VARCHAR(10),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    -- stall_count is NOT stored here — derive live via
    -- SELECT COUNT(*) FROM stall WHERE centre_id = ? AND is_deleted = 0
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE stall (
    stall_id        INT AUTO_INCREMENT PRIMARY KEY,
    centre_id       INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    -- cuisine_type: free text, populated by Lancea during data load
    cuisine_type    VARCHAR(100),
    -- grade: nullable until SFA data is loaded (dataset 3, optional)
    grade           CHAR(1),
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,      -- soft delete only, never hard-delete a stall
    deleted_at      TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stall_centre FOREIGN KEY (centre_id) REFERENCES hawker_centre(centre_id),
    CONSTRAINT chk_stall_grade CHECK (grade IN ('A','B','C','D') OR grade IS NULL)
) ENGINE=InnoDB;

CREATE TABLE menu_item (
    menu_item_id    INT AUTO_INCREMENT PRIMARY KEY,
    stall_id        INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    is_available    TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_item_stall FOREIGN KEY (stall_id) REFERENCES stall(stall_id),
    CONSTRAINT chk_menu_item_price CHECK (price > 0)
) ENGINE=InnoDB;

CREATE TABLE customer (
    customer_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150),                       -- NULL allowed = guest
    email           VARCHAR(255) UNIQUE,
    -- Auth (password hash etc.) is out of scope for this module —
    -- to confirm with Kristen. No credential storage here for now.
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE wallet (
    wallet_id       INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL UNIQUE,                -- UNIQUE enforces the 1-1 with customer
    balance         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT chk_wallet_balance CHECK (balance >= 0)
    -- balance must only ever change via ledger_entry inserts (Lideon) — never a manual UPDATE
) ENGINE=InnoDB;

