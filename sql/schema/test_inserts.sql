-- =====================================================
-- test_inserts.sql
-- Sanity checks for 01_core.sql — run AFTER 01_core.sql
-- Confirms tables accept valid data and reject invalid data
-- =====================================================

-- Valid inserts — these should all succeed
INSERT INTO hawker_centre (name, address) VALUES ('Maxwell Food Centre', '1 Kadayanallur St');
INSERT INTO stall (centre_id, name, cuisine_type, grade, open_time, close_time) VALUES (1, 'Rice', 'Chinese', 'A', '07:00:00', '20:00:00');
INSERT INTO menu_item (stall_id, name, price) VALUES (1, 'Fried Rice', 5.50);
INSERT INTO customer (name, email) VALUES ('Test User', 'test@example.com');
INSERT INTO wallet (customer_id, balance) VALUES (1, 20.00);

-- Check the data landed correctly
SELECT * FROM stall;
SELECT * FROM menu_item;
SELECT * FROM wallet;

-- Invalid inserts — these should ALL FAIL (constraint violations)
-- Uncomment one at a time to test:

-- INSERT INTO stall (centre_id, name, grade) VALUES (1, 'Bad Grade Stall', 'F');
-- INSERT INTO stall (centre_id, name, open_time, close_time) VALUES (1, 'Backwards Hours Stall', '20:00:00', '07:00:00');
-- INSERT INTO stall (centre_id, name, open_time) VALUES (1, 'Half-set Hours Stall', '07:00:00');  -- close_time left NULL also fails
-- INSERT INTO menu_item (stall_id, name, price) VALUES (1, 'Free Item', -5.00);
-- INSERT INTO wallet (customer_id, balance) VALUES (1, -10.00);  -- duplicate customer_id also fails (UNIQUE)