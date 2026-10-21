"""
generate_mongo_events.py
Owner: WILEEN

For every SQL order created by generate_orders.py, insert a matching
payment_events document in Mongo (same rule as the live pay path:
SQL first, Mongo after).

Reads etl/raw/generated_orders.csv (or a path given as the first argument):
    order_id,stall_id,customer_id,amount,method[,created_at]

Safe to re-run: an order that already has a payment event is skipped.

    python etl/scripts/generate_mongo_events.py
    python etl/scripts/generate_mongo_events.py path/to/other.csv
"""

import csv
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

from pymongo import UpdateOne

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "nosql"))
from db import get_db  # noqa: E402

DEFAULT_CSV = Path(__file__).resolve().parent.parent / "raw" / "generated_orders.csv"
METHODS = {"paynow", "card", "cash"}
BATCH = 1000


def parse_time(value):
    """ISO time from the CSV, treated as UTC if it has no timezone."""
    if not value:
        return datetime.now(timezone.utc)
    dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def build_event(row):
    """One payment_events doc. Ids are strings to match the Mongo schema."""
    method = row["method"].strip().lower()
    if method not in METHODS:
        raise ValueError(f"unknown payment method: {row['method']!r}")

    doc = {
        "order_id": str(row["order_id"]).strip(),
        "stall_id": str(row["stall_id"]).strip(),
        "customer_id": str(row["customer_id"]).strip(),
        "amount": round(float(row["amount"]), 2),
        "method": method,
        "event_type": "payment",
        "created_at": parse_time(row.get("created_at")),
    }
    # payments are simulated, so these references are faked
    if method == "paynow":
        doc["paynow_ref"] = f"PN-{doc['order_id']}"
    elif method == "card":
        doc["card_last4"] = f"{random.randint(0, 9999):04d}"
    return doc


def run(csv_path=DEFAULT_CSV):
    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"{csv_path} not found. Run generate_orders.py first, or check "
            "the CSV path and columns match what this script expects."
        )

    with csv_path.open(newline="") as f:
        rows = list(csv.DictReader(f))

    ops, bad = [], 0
    for row in rows:
        try:
            doc = build_event(row)
        except (KeyError, ValueError) as exc:
            bad += 1
            print(f"skipping bad row {row}: {exc}")
            continue
        ops.append(UpdateOne(
            {"order_id": doc["order_id"], "event_type": "payment"},
            {"$setOnInsert": doc},
            upsert=True,
        ))

    coll = get_db().payment_events
    inserted = 0
    for i in range(0, len(ops), BATCH):
        result = coll.bulk_write(ops[i:i + BATCH], ordered=False)
        inserted += result.upserted_count

    skipped = len(ops) - inserted
    print(f"{csv_path.name}: {len(rows)} rows, {inserted} inserted, "
          f"{skipped} already in Mongo, {bad} bad rows")


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV)