"""MongoDB connection using MONGO_URI and MONGO_DB from the repo-root .env."""

import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

_client = None


def get_mongo_client():
    global _client
    if _client is None:
        uri = os.environ.get("MONGO_URI")
        if not uri:
            raise RuntimeError("MONGO_URI is not set in .env")
        _client = MongoClient(uri, serverSelectionTimeoutMS=4000)
    return _client


def get_mongo_db():
    name = os.environ.get("MONGO_DB", "hawkerate")
    return get_mongo_client()[name]


def mongo_ok():
    try:
        get_mongo_client().admin.command("ping")
        return True, None
    except (PyMongoError, RuntimeError) as exc:
        return False, str(exc)
