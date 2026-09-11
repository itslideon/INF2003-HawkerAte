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

## Rules

- `ENGINE=InnoDB` everywhere
- Money columns: `DECIMAL(10,2)`
- IDs: `INT AUTO_INCREMENT`
- One pay = one SQL `TRANSACTION` (`BEGIN ... COMMIT`)
- Never set `wallet.balance` by hand — only via `ledger_entry`
- Soft-delete stalls (`is_deleted` / `deleted_at`), never hard-delete
- Never `DELETE` a `ledger_entry` row
