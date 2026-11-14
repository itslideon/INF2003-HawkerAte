# ER diagram

The diagram is `er.png`. Keep the draw.io source next to it as `er.drawio`.

It covers every table in the four schema files:

| Colour / legend | File | Tables |
|---|---|---|
| blue | `sql/schema/01_core.sql` | hawker_centre, stall, menu_item, customer, wallet |
| orange | `sql/schema/02_fintech.sql` | orders, order_line, payment, ledger_entry |
| (new) | `sql/schema/03_split.sql` | dining_session, session_member |
| (new) | `sql/schema/04_queue.sql` | stall_queue |

## Relationships

| From | To | Cardinality | Enforced by |
|---|---|---|---|
| hawker_centre | stall | 1 – M | `stall.centre_id` FK |
| stall | menu_item | 1 – M | `menu_item.stall_id` FK |
| customer | wallet | 1 – 1 | `wallet.customer_id` FK + UNIQUE |
| customer | orders | 1 – M | `orders.customer_id` FK |
| stall | orders | 1 – M | `orders.stall_id` FK |
| orders | order_line | 1 – M (at least 1) | `order_line.order_id` FK |
| menu_item | order_line | 1 – M | `order_line.menu_item_id` FK |
| orders | payment | 1 – 0..1 | `payment.order_id` FK + UNIQUE |
| wallet | ledger_entry | 1 – M | `ledger_entry.wallet_id` FK |
| orders | ledger_entry | 1 – M (`order_id` nullable) | `ledger_entry.order_id` FK |
| orders | dining_session | 1 – 0..1 | `dining_session.order_id` FK + UNIQUE |
| dining_session | session_member | 1 – M | `session_member.session_id` FK |
| customer | session_member | 1 – M | `session_member.customer_id` FK; UNIQUE (session_id, customer_id) |
| stall | stall_queue | 1 – M | `stall_queue.stall_id` FK; UNIQUE (stall_id, ticket_no) |
| orders | stall_queue | 1 – 0..1 | `stall_queue.order_id` FK + UNIQUE |

`session_member` is the link table that resolves the M:N between customer and dining_session.

## Columns added since the first diagram

- `stall.open_time`, `stall.close_time` (TIME, both set or both NULL, close > open)
- `ledger_entry.entry_type` is now ENUM(`payment`, `refund`, `split_settle`)
- `dining_session`: PK session_id, FK order_id UQ, split_type ENUM(`equal`, `by_item`, `custom`), created_at
- `session_member`: PK session_member_id, FK session_id, FK customer_id, share_amount [>0], is_settled, settled_at
- `stall_queue`: PK queue_id, FK stall_id, FK order_id UQ, ticket_no [>0], joined_at

## Design notes

**Reversing ledger.** Rows in `ledger_entry` are only ever added, never updated or deleted. A refund does not edit the original payment row. It inserts a new `refund` row for the same `order_id` that reverses it and credits the wallet back. Wallet balances only change alongside a ledger row, never through a manual UPDATE, so the ledger is the audit trail for every balance.

**Positive amounts.** `amount` is always > 0 (`chk_ledger_amount`). The direction comes from `entry_type` and which wallet the row belongs to.

**dining_session (Makan split).** The organizer has already paid the stall through the normal order (`orders` + `payment` + one `payment` ledger row). The session only records who owes the organizer what. `share_amount` is each friend's share, and the organizer's own row is created already settled. Settling moves money wallet → wallet as two `split_settle` ledger rows with the same `order_id`: one debits the friend's wallet and one credits the organizer's. It is not an extra stall payment. `chk_session_member_settled` keeps `settled_at` set exactly when `is_settled = 1`. A split bill can't be refunded.

**SQL ↔ MongoDB boundary.** MongoDB `payment_events` stores `order_id`, `stall_id` and `customer_id` as **strings** ("1", "2"). They point to the MariaDB INT ids but are not enforced foreign keys. Every pay writes one Mongo event, and every refund writes one refund event. Makan split and `split_settle` stay in MariaDB only, with no Mongo event, because the original payment already has its event.
