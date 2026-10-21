"""
Build sample orders for demos and load tests.

Uses the same rules as POST /orders/pay: one SQL transaction per order,
wallet updates only via ledger_entry, total = sum of order lines.
Writes order ids to etl/raw/generated_orders.csv for the Mongo event loader.

Payment-method mix (Lancea / Iter 2). MAS national retail stats are not
stall-level PayNow; hawkers stay a bit more cash. Pick method with these
weights, then check the result with sql/queries/payment_method_mix.sql:

    paynow 45% / card 20% / cash 35%
"""

from __future__ import annotations

import csv
import os
import random
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CSV_PATH = REPO_ROOT / "etl" / "raw" / "generated_orders.csv"

load_dotenv(REPO_ROOT / ".env")

# Demo weights only — not live bank data.
METHOD_WEIGHTS = {"paynow": 0.45, "card": 0.20, "cash": 0.35}
METHODS = tuple(METHOD_WEIGHTS.keys())
WEIGHTS = tuple(METHOD_WEIGHTS.values())
SEED_WALLET = Decimal("500.00")
DEFAULT_N = 200


def get_conn():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "hawkerate"),
    )


def _pick_method() -> str:
    return random.choices(METHODS, weights=WEIGHTS, k=1)[0]


def _load_menus(cur) -> dict[int, list[dict]]:
    cur.execute(
        """
        SELECT stall_id, menu_item_id, price
        FROM menu_item
        WHERE is_available = 1
        """
    )
    menus: dict[int, list[dict]] = {}
    for row in cur.fetchall():
        menus.setdefault(int(row["stall_id"]), []).append(
            {
                "menu_item_id": int(row["menu_item_id"]),
                "price": Decimal(str(row["price"])),
            }
        )
    return menus


def _ensure_wallet(cur, amount: Decimal) -> tuple[int, int]:
    """Return (customer_id, wallet_id) that can pay amount. New wallets are
    INSERTed with a starting balance (same idea as test_inserts), never a
    bare UPDATE of an existing wallet.balance.
    """
    cur.execute(
        """
        SELECT customer_id, wallet_id, balance
        FROM wallet
        WHERE balance >= %s
        ORDER BY wallet_id
        LIMIT 1
        FOR UPDATE
        """,
        (amount,),
    )
    row = cur.fetchone()
    if row:
        return int(row["customer_id"]), int(row["wallet_id"])

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    cur.execute(
        "INSERT INTO customer (name, email) VALUES (%s, %s)",
        ("Generator diner", f"gen-{stamp}@hawkerate.local"),
    )
    customer_id = int(cur.lastrowid)
    starting = amount if amount > SEED_WALLET else SEED_WALLET
    cur.execute(
        "INSERT INTO wallet (customer_id, balance) VALUES (%s, %s)",
        (customer_id, starting),
    )
    return customer_id, int(cur.lastrowid)


def _enqueue(cur, stall_id: int, order_id: int) -> None:
    cur.execute(
        "SELECT COALESCE(MAX(ticket_no), 0) AS m FROM stall_queue WHERE stall_id = %s",
        (stall_id,),
    )
    ticket = int(cur.fetchone()["m"]) + 1
    cur.execute(
        """
        INSERT INTO stall_queue (stall_id, order_id, ticket_no)
        VALUES (%s, %s, %s)
        """,
        (stall_id, order_id, ticket),
    )


def generate_order(cur, stall_id: int, dishes: list[dict]) -> dict:
    """Insert one paid order in the open transaction; return CSV fields."""
    n_lines = random.randint(1, min(3, len(dishes)))
    picked = random.sample(dishes, n_lines)
    lines = []
    total = Decimal("0.00")
    for dish in picked:
        qty = random.randint(1, 2)
        lines.append((dish["menu_item_id"], qty, dish["price"]))
        total += dish["price"] * qty
    total = total.quantize(Decimal("0.01"))

    customer_id, wallet_id = _ensure_wallet(cur, total)
    cur.execute(
        "SELECT balance FROM wallet WHERE wallet_id = %s FOR UPDATE",
        (wallet_id,),
    )
    balance = Decimal(str(cur.fetchone()["balance"]))
    new_balance = balance - total
    if new_balance < 0:
        raise RuntimeError("wallet could not cover generated order")

    method = _pick_method()
    created = datetime.now(timezone.utc)
    created_sql = created.replace(tzinfo=None)
    cur.execute(
        """
        INSERT INTO orders (customer_id, stall_id, status, total_amount, created_at)
        VALUES (%s, %s, 'paid', %s, %s)
        """,
        (customer_id, stall_id, total, created_sql),
    )
    order_id = int(cur.lastrowid)
    for menu_item_id, qty, unit_price in lines:
        cur.execute(
            """
            INSERT INTO order_line (order_id, menu_item_id, quantity, unit_price)
            VALUES (%s, %s, %s, %s)
            """,
            (order_id, menu_item_id, qty, unit_price),
        )
    cur.execute(
        "INSERT INTO payment (order_id, method, amount) VALUES (%s, %s, %s)",
        (order_id, method, total),
    )
    cur.execute(
        """
        INSERT INTO ledger_entry (wallet_id, order_id, entry_type, amount)
        VALUES (%s, %s, 'payment', %s)
        """,
        (wallet_id, order_id, total),
    )
    cur.execute(
        "UPDATE wallet SET balance = %s WHERE wallet_id = %s",
        (new_balance, wallet_id),
    )
    _enqueue(cur, stall_id, order_id)
    return {
        "order_id": order_id,
        "stall_id": stall_id,
        "customer_id": customer_id,
        "amount": f"{total:.2f}",
        "method": method,
        "created_at": created.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def run(n_orders: int) -> None:
    """Insert n_orders across existing customers and stalls.

    Write generated order_ids to etl/raw/generated_orders.csv so
    generate_mongo_events.py can load matching payment_events.
    Overwrites the CSV each run (does not append).
    """
    if n_orders < 1:
        raise ValueError("n_orders must be at least 1")

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    rows: list[dict] = []
    try:
        cur.execute("SELECT stall_id FROM stall WHERE is_deleted = 0")
        stall_ids = [int(r["stall_id"]) for r in cur.fetchall()]
        menus = _load_menus(cur)
        live = [s for s in stall_ids if menus.get(s)]
        if not live:
            raise RuntimeError("no available menu_item rows — load prices / test_inserts first")
        conn.commit()

        for _ in range(n_orders):
            stall_id = random.choice(live)
            conn.start_transaction()
            try:
                cur.execute(
                    "SELECT stall_id FROM stall WHERE stall_id = %s AND is_deleted = 0 FOR UPDATE",
                    (stall_id,),
                )
                if not cur.fetchone():
                    conn.rollback()
                    continue
                row = generate_order(cur, stall_id, menus[stall_id])
                conn.commit()
                rows.append(row)
            except mysql.connector.Error:
                conn.rollback()
                raise
    finally:
        cur.close()
        conn.close()

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "order_id",
                "stall_id",
                "customer_id",
                "amount",
                "method",
                "created_at",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    mix: dict[str, int] = {m: 0 for m in METHODS}
    for row in rows:
        mix[row["method"]] += 1
    print(
        f"wrote {len(rows)} orders to {CSV_PATH} "
        f"(paynow {mix['paynow']}, card {mix['card']}, cash {mix['cash']})"
    )


if __name__ == "__main__":
    n = DEFAULT_N
    if len(sys.argv) > 1:
        n = int(sys.argv[1])
    run(n)
