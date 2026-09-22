"""
generate_mongo_events.py
Owner: WILEEN

For every SQL order/payment created by generate_orders.py, insert a
matching payment_events document in Mongo — mirroring the "insert
AFTER MariaDB commit" rule from the real pay path.

Interchange format with generate_orders.py (documented in etl/README.md):
Lideon's generate_orders.py appends one CSV row per created order to
etl/raw/generated_orders.csv: order_id,stall_id,customer_id,amount,method
"""

import csv
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "nosql"))
from db import get_db  # noqa: E402

ORDERS_CSV = Path(__file__).resolve().parent.parent / "raw" / "generated_orders.csv"


def generate_event_for_order(order_id: int, stall_id: int, customer_id: int,
                              amount: float, method: str) -> None:
    """Build the right shape of doc depending on method (paynow/card/cash
    have different fields — see nosql/models/payment_events.example.json)
    and insert into the `payment_events` collection in the `hawkerate`
    Mongo DB. Payments are simulated, so paynow_ref/card_last4 are faked
    here rather than coming from a real gateway."""
    doc = {
        "order_id": order_id,
        "stall_id": stall_id,
        "customer_id": customer_id,
        "amount": float(amount),
        "method": method,
        "event_type": "payment",
        "created_at": datetime.now(timezone.utc),
    }

    if method == "paynow":
        doc["paynow_ref"] = f"PN-{doc['created_at']:%Y%m%d}-{random.randint(0, 9999):04d}"
    elif method == "card":
        doc["card_last4"] = f"{random.randint(0, 9999):04d}"
    elif method != "cash":
        raise ValueError(f"unknown payment method: {method!r}")

    get_db().payment_events.insert_one(doc)


def run() -> None:
    if not ORDERS_CSV.exists():
        raise FileNotFoundError(
            f"{ORDERS_CSV} not found — run generate_orders.py first, or check "
            "the CSV path/columns still match what this script expects."
        )

    with ORDERS_CSV.open(newline="") as f:
        rows = list(csv.DictReader(f))

    for row in rows:
        generate_event_for_order(
            order_id=int(row["order_id"]),
            stall_id=int(row["stall_id"]),
            customer_id=int(row["customer_id"]),
            amount=float(row["amount"]),
            method=row["method"],
        )

    print(f"inserted {len(rows)} payment_events from {ORDERS_CSV}")


if __name__ == "__main__":
    run()
