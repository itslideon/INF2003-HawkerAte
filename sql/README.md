# MariaDB

Database name: `hawkerate`.

```sql
CREATE DATABASE IF NOT EXISTS hawkerate CHARACTER SET utf8mb4;
USE hawkerate;
```

Run the scripts in this order — later files assume earlier tables exist:

1. `schema/01_core.sql` — centres, stalls, menu, customers, wallets
2. `schema/02_fintech.sql` — orders, lines, payments, ledger
3. `schema/03_split.sql` — group bill split (used later)
4. `views/*.sql`
5. `indexes.sql`

```bash
mysql -u root -p hawkerate < sql/schema/01_core.sql
mysql -u root -p hawkerate < sql/schema/test_inserts.sql
mysql -u root -p hawkerate < sql/schema/02_fintech.sql
mysql -u root -p hawkerate < sql/schema/03_split.sql
mysql -u root -p hawkerate < sql/views/v_daily_settlement.sql
mysql -u root -p hawkerate < sql/indexes.sql
```

Checkout (`POST /orders/pay`) needs `01_core.sql` **and** `02_fintech.sql`. `test_inserts.sql` is optional and only after `01_core.sql`. Views/indexes can wait until those files are filled in.

On Windows, if `mysqld` is not a service, start it with a quoted `--defaults-file=` (paths with spaces break if unquoted). Empty root password: omit `-p` or pass an empty one, matching `.env` `DB_PASSWORD`.

## `schema/test_inserts.sql`

Optional. After `01_core.sql`, this drops in one centre / stall / dish / customer / wallet so you can see the tables working. It also has a few commented-out inserts that should fail (bad grade, negative price, etc.). Uncomment one at a time if you want to check the constraints.

Only run that on a throwaway database — it writes real rows.

## Conventions we stuck to

- InnoDB, money as `DECIMAL(10,2)`, ids as `INT AUTO_INCREMENT`
- One payment = one `START TRANSACTION … COMMIT`
- Don’t update `wallet.balance` by itself in the live app; go through `ledger_entry`
- Don’t delete ledger rows; a refund is a new reversing row
- Stalls are soft-deleted (`is_deleted` / `deleted_at`)
