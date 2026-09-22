"""
setup_collections.py
Owner: WILEEN

Creates the three `hawkerate` Mongo collections with $jsonSchema
validation + their indexes. Safe to re-run: creates a collection if
missing, otherwise updates its validator via collMod, and index
creation is idempotent.

Run once against a fresh Atlas cluster / local mongod:
    python nosql/setup_collections.py
"""

from pymongo import ASCENDING, TEXT
from pymongo.errors import CollectionInvalid

from db import get_db

PAYMENT_EVENTS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "order_id", "stall_id", "customer_id", "amount",
            "method", "event_type", "created_at",
        ],
        "properties": {
            "order_id": {"bsonType": "string"},
            "stall_id": {"bsonType": "string"},
            "customer_id": {"bsonType": "string"},
            "amount": {"bsonType": "double"},
            "method": {"enum": ["paynow", "card", "cash"]},
            "event_type": {"enum": ["payment", "refund"]},
            "paynow_ref": {"bsonType": "string"},
            "card_last4": {"bsonType": "string"},
            "reversed_event_id": {"bsonType": "objectId"},
            "created_at": {"bsonType": "date"},
        },
    }
}

REVIEWS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "stall_id", "customer_id", "rating", "is_deleted", "created_at",
        ],
        "properties": {
            "stall_id": {"bsonType": "string"},
            "customer_id": {"bsonType": "string"},
            "rating": {"bsonType": "int", "minimum": 1, "maximum": 5},
            "comment": {"bsonType": "string"},
            "is_deleted": {"bsonType": "bool"},
            "created_at": {"bsonType": "date"},
        },
    }
}

INVESTOR_WATCHLIST_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["customer_id", "created_at"],
        "properties": {
            "customer_id": {"bsonType": "string"},
            "watched_centre_ids": {"bsonType": "array", "items": {"bsonType": "string"}},
            "watched_stall_ids": {"bsonType": "array", "items": {"bsonType": "string"}},
            "created_at": {"bsonType": "date"},
        },
    }
}


def ensure_collection(db, name: str, validator: dict) -> None:
    if name in db.list_collection_names():
        db.command("collMod", name, validator=validator, validationLevel="moderate")
        print(f"updated validator on existing collection: {name}")
        return
    try:
        db.create_collection(name, validator=validator, validationLevel="moderate")
        print(f"created collection: {name}")
    except CollectionInvalid:
        # created concurrently between the list check and here — fine
        db.command("collMod", name, validator=validator, validationLevel="moderate")


def main() -> None:
    db = get_db()

    ensure_collection(db, "payment_events", PAYMENT_EVENTS_SCHEMA)
    db.payment_events.create_index([("stall_id", ASCENDING), ("created_at", ASCENDING)])
    db.payment_events.create_index("order_id")

    ensure_collection(db, "reviews", REVIEWS_SCHEMA)
    db.reviews.create_index([("stall_id", ASCENDING), ("is_deleted", ASCENDING)])
    db.reviews.create_index([("comment", TEXT)])

    ensure_collection(db, "investor_watchlist", INVESTOR_WATCHLIST_SCHEMA)
    db.investor_watchlist.create_index("customer_id", unique=True)

    print("done. collections:", db.list_collection_names())


if __name__ == "__main__":
    main()