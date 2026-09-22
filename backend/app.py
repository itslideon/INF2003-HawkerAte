"""
Browse APIs for HawkerAte (see docs/api-contract.md).

    pip install -r backend/requirements.txt
    python backend/app.py
"""

from decimal import Decimal
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from flask import Flask, jsonify
from flask_cors import CORS
from mysql.connector import Error

from db import get_conn

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})


def json_safe(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def fetch_all(sql, params=None):
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        cur.close()
        return [{k: json_safe(v) for k, v in row.items()} for row in rows]
    finally:
        conn.close()


def fetch_one(sql, params=None):
    rows = fetch_all(sql, params)
    return rows[0] if rows else None


@app.get("/health")
def health():
    try:
        get_conn().close()
        return jsonify({"ok": True, "db": "up"})
    except Error as exc:
        return jsonify({"ok": False, "db": "down", "error": str(exc)}), 503


@app.get("/centres")
def centres():
    try:
        rows = fetch_all(
            """
            SELECT centre_id, name, address, postal_code, latitude, longitude
            FROM hawker_centre
            ORDER BY name
            """
        )
        return jsonify(rows)
    except Error as exc:
        return jsonify({"error": str(exc)}), 503


@app.get("/centres/<int:centre_id>/stalls")
def stalls_for_centre(centre_id):
    try:
        if not fetch_one("SELECT centre_id FROM hawker_centre WHERE centre_id = %s", (centre_id,)):
            return jsonify({"error": "centre not found"}), 404
        rows = fetch_all(
            """
            SELECT stall_id, name, cuisine_type, grade
            FROM stall
            WHERE centre_id = %s AND is_deleted = 0
            ORDER BY name
            """,
            (centre_id,),
        )
        return jsonify(rows)
    except Error as exc:
        return jsonify({"error": str(exc)}), 503


@app.get("/stalls/<int:stall_id>/menu")
def menu_for_stall(stall_id):
    try:
        if not fetch_one(
            "SELECT stall_id FROM stall WHERE stall_id = %s AND is_deleted = 0",
            (stall_id,),
        ):
            return jsonify({"error": "stall not found"}), 404
        rows = fetch_all(
            """
            SELECT menu_item_id, name, price, is_available
            FROM menu_item
            WHERE stall_id = %s
            ORDER BY name
            """,
            (stall_id,),
        )
        return jsonify(rows)
    except Error as exc:
        return jsonify({"error": str(exc)}), 503


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000, debug=True)
