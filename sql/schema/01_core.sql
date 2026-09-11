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
    stall_count     INT,                              -- TODO Tanvi: from NEA dataset, or derive via COUNT(*)?
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE stall (
    stall_id        INT AUTO_INCREMENT PRIMARY KEY,
    centre_id       INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    cuisine_type    VARCHAR(100),                      -- TODO Tanvi: confirm — Lancea's "avg ticket by cuisine" view needs this
    grade           CHAR(1),                           -- TODO Tanvi: confirm SFA grade source / how it's populated
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
    name            VARCHAR(150),                       -- NULL allowed = guest (Kristen's checkout only asks nameless accounts)
    email           VARCHAR(255) UNIQUE,
    -- TODO Tanvi: confirm with Kristen whether auth (password hash etc.) lives here or is out of scope for the module
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

-- TODO Tanvi: sit with Wileen once to confirm these column names (stall_id,
-- customer_id, ...) are exactly what Mongo documents will reference.
