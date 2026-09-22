# SQL setup (MariaDB, InnoDB)

## Create the database

```sql
CREATE DATABASE IF NOT EXISTS hawkerate CHARACTER SET utf8mb4;
USE hawkerate;
```

## Run order — always in this order

1. `schema/01_core.sql`    (Tanvi)
2. `schema/02_fintech.sql` (Lideon)
3. `schema/03_split.sql`   (Lideon, Iter 3+)
4. `views/*.sql`           (Lancea)
5. `indexes.sql`           (Lancea)

Via CLI:

```bash
mysql -u root -p hawkerate < sql/schema/01_core.sql
mysql -u root -p hawkerate < sql/schema/02_fintech.sql
mysql -u root -p hawkerate < sql/schema/03_split.sql
for f in sql/views/*.sql; do mysql -u root -p hawkerate < "$f"; done
mysql -u root -p hawkerate < sql/indexes.sql
```

## Sanity check — `schema/test_inserts.sql`

After running `schema/01_core.sql`, use `schema/test_inserts.sql` to confirm the tables accept valid data and reject invalid data.

Via CLI:

```bash
mysql -u root -p hawkerate < sql/schema/test_inserts.sql
```

What it does:

- Inserts one valid row into `hawker_centre`, `stall`, `menu_item`, `customer`, and `wallet`, then `SELECT`s from `stall`, `menu_item`, and `wallet` 
- Includes a block of invalid inserts (bad `grade`, negative `price`, negative `balance`) commented out at the bottom. Uncomment and run **one at a time** to confirm each constraint violation is rejected — don't run them all together, since the earlier statements would stop the script once one fails.

Since it inserts real rows, only run it against a scratch/dev database, and re-create the schema (or delete the test rows) before seeding real data.

## Rules

- `ENGINE=InnoDB` everywhere
- Money columns: `DECIMAL(10,2)`
- IDs: `INT AUTO_INCREMENT`
- One pay = one SQL `TRANSACTION` (`BEGIN ... COMMIT`)
- Never set `wallet.balance` by hand — only via `ledger_entry`
- Soft-delete stalls (`is_deleted` / `deleted_at`), never hard-delete
- Never `DELETE` a `ledger_entry` row
