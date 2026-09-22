"""
db.py
Owner: WILEEN

Shared MongoDB connection helper — every script under nosql/ and
etl/scripts/generate_mongo_events.py should get its database handle
through get_db() instead of hardcoding a URI.

Reads MONGO_URI / MONGO_DB from .env (see .env.example at repo root).
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        uri = os.environ["MONGO_URI"]
        _client = MongoClient(uri)
    return _client


def get_db() -> Database:
    db_name = os.environ.get("MONGO_DB", "hawkerate")
    return get_client()[db_name]


if __name__ == "__main__":
    db = get_db()
    print(f"Connected to Mongo database: {db.name!r}")
    print("Collections:", db.list_collection_names())
