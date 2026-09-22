"""
seed.py
Owner: WILEEN

Inserts the example docs from nosql/models/*.example.json (with real
types/ObjectIds instead of the placeholder strings) so there's data to
run the aggregations against. Safe to re-run — clears and re-inserts.

    python nosql/setup_collections.py   # once, to create collections/indexes
    python nosql/seed.py
"""

from datetime import datetime, timezone

from db import get_db


def dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def seed_payment_events(db) -> None:
    db.payment_events.delete_many({})

    payment = db.payment_events.insert_one({
        "order_id": "1042",
        "stall_id": "17",
        "customer_id": "88",
        "amount": 6.50,
        "method": "paynow",
        "event_type": "payment",
        "paynow_ref": "PN-20261004-0007",
        "created_at": dt("2026-10-04T12:31:05Z"),
    })

    db.payment_events.insert_many([
        {
            "order_id": "1043",
            "stall_id": "17",
            "customer_id": "41",
            "amount": 4.20,
            "method": "card",
            "event_type": "payment",
            "card_last4": "4242",
            "created_at": dt("2026-10-04T12:33:10Z"),
        },
        {
            "order_id": "1044",
            "stall_id": "9",
            "customer_id": "12",
            "amount": 3.80,
            "method": "cash",
            "event_type": "payment",
            "created_at": dt("2026-10-04T12:40:22Z"),
        },
        {
            "order_id": "1042",
            "stall_id": "17",
            "customer_id": "88",
            "amount": -6.50,
            "method": "paynow",
            "event_type": "refund",
            "reversed_event_id": payment.inserted_id,
            "created_at": dt("2026-10-05T09:00:00Z"),
        },
    ])
    print(f"seeded {db.payment_events.count_documents({})} payment_events")


def seed_reviews(db) -> None:
    db.reviews.delete_many({})
    db.reviews.insert_one({
        "stall_id": "17",
        "customer_id": "88",
        "rating": 4,
        "comment": "Good char kway teow, a bit long queue at lunch",
        "is_deleted": False,
        "created_at": dt("2026-10-10T08:15:00Z"),
    })
    print(f"seeded {db.reviews.count_documents({})} reviews")


def seed_investor_watchlist(db) -> None:
    db.investor_watchlist.delete_many({})
    db.investor_watchlist.insert_one({
        "customer_id": "5",
        "watched_centre_ids": ["1", "4", "9"],
        "watched_stall_ids": [],
        "created_at": dt("2026-10-20T00:00:00Z"),
    })
    print(f"seeded {db.investor_watchlist.count_documents({})} investor_watchlist")


def main() -> None:
    db = get_db()
    seed_payment_events(db)
    seed_reviews(db)
    seed_investor_watchlist(db)


if __name__ == "__main__":
    main()