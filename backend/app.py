"""HawkerAte HTTP API. See docs/api-contract.md for request/response shapes."""

from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from flask import Flask, jsonify, request
from flask_cors import CORS
from mysql.connector import Error
from pymongo.errors import PyMongoError

from db import get_conn
from mongo import get_mongo_db, mongo_ok

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

METHODS = {"paynow", "card", "cash"}


def json_safe(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
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


def as_id_str(value):
    """Mongo stores MariaDB integer ids as strings."""
    return str(value).strip()


@app.get("/health")
def health():
    """MariaDB + Mongo connectivity check."""
    sql_ok, sql_err = True, None
    try:
        get_conn().close()
    except Error as exc:
        sql_ok, sql_err = False, str(exc)
    m_ok, m_err = mongo_ok()
    code = 200 if sql_ok and m_ok else 503
    return jsonify({
        "ok": sql_ok and m_ok,
        "mariadb": "up" if sql_ok else "down",
        "mongo": "up" if m_ok else "down",
        "mariadb_error": sql_err,
        "mongo_error": m_err,
    }), code


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


@app.get("/stalls/<stall_id>/reviews")
def reviews_for_stall(stall_id):
    """Non-deleted reviews for a stall, plus average rating."""
    stall_key = as_id_str(stall_id)
    try:
        docs = list(
            get_mongo_db().reviews.find(
                {"stall_id": stall_key, "is_deleted": False},
                {"_id": 0, "customer_id": 1, "rating": 1, "comment": 1, "created_at": 1},
            ).sort("created_at", -1)
        )
    except (PyMongoError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 503

    ratings = [int(d["rating"]) for d in docs if "rating" in d]
    count = len(ratings)
    average = round(sum(ratings) / count, 2) if count else 0
    reviews = [
        {
            "customer_id": d.get("customer_id"),
            "rating": d.get("rating"),
            "comment": d.get("comment"),
            "created_at": json_safe(d.get("created_at")),
        }
        for d in docs
    ]
    return jsonify({
        "average_rating": average,
        "review_count": count,
        "reviews": reviews,
    })


@app.post("/reviews")
def create_review():
    body = request.get_json(silent=True) or {}
    stall_id = as_id_str(body.get("stall_id", ""))
    customer_id = as_id_str(body.get("customer_id", ""))
    comment = body.get("comment") or ""
    try:
        rating = int(body.get("rating"))
    except (TypeError, ValueError):
        return jsonify({"error": "rating must be an integer 1–5"}), 400

    if not stall_id or not customer_id:
        return jsonify({"error": "stall_id and customer_id are required"}), 400
    if rating < 1 or rating > 5:
        return jsonify({"error": "rating must be 1–5"}), 400
    if not isinstance(comment, str):
        return jsonify({"error": "comment must be a string"}), 400

    doc = {
        "stall_id": stall_id,
        "customer_id": customer_id,
        "rating": rating,
        "comment": comment,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = get_mongo_db().reviews.insert_one(doc)
    except (PyMongoError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 503

    return jsonify({
        "ok": True,
        "id": str(result.inserted_id),
        "stall_id": stall_id,
        "customer_id": customer_id,
        "rating": rating,
    }), 201


def _write_payment_event(order_id, stall_id, customer_id, amount, method):
    """Append-only payment log in Mongo. Called only after the SQL commit."""
    doc = {
        "order_id": as_id_str(order_id),
        "stall_id": as_id_str(stall_id),
        "customer_id": as_id_str(customer_id),
        "amount": float(amount),
        "method": method,
        "event_type": "payment",
        "created_at": datetime.now(timezone.utc),
    }
    if method == "paynow":
        doc["paynow_ref"] = f"PN-{order_id}"
    if method == "card":
        doc["card_last4"] = "0000"
    get_mongo_db().payment_events.insert_one(doc)


@app.post("/orders/pay")
def pay_order():
    """
    One MariaDB transaction: order, lines, payment, ledger, wallet.
    Then a payment_events document in Mongo. If Mongo fails, SQL still stands
    and the response sets mongo_written to false.
    """
    body = request.get_json(silent=True) or {}
    try:
        customer_id = int(body.get("customer_id"))
        stall_id = int(body.get("stall_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "customer_id and stall_id must be integers"}), 400

    method = (body.get("method") or "").strip().lower()
    items = body.get("items") or []
    if method not in METHODS:
        return jsonify({"error": "method must be paynow, card, or cash"}), 400
    if not items:
        return jsonify({"error": "items cannot be empty"}), 400

    parsed_items = []
    for item in items:
        try:
            parsed_items.append(
                {
                    "menu_item_id": int(item["menu_item_id"]),
                    "quantity": int(item["quantity"]),
                }
            )
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "each item needs menu_item_id and quantity"}), 400
        if parsed_items[-1]["quantity"] < 1:
            return jsonify({"error": "quantity must be at least 1"}), 400

    conn = None
    order_id = None
    total = Decimal("0.00")
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()

        cur.execute(
            "SELECT stall_id FROM stall WHERE stall_id = %s AND is_deleted = 0",
            (stall_id,),
        )
        if not cur.fetchone():
            conn.rollback()
            return jsonify({"error": "stall not found"}), 404

        cur.execute(
            "SELECT wallet_id, balance FROM wallet WHERE customer_id = %s FOR UPDATE",
            (customer_id,),
        )
        wallet = cur.fetchone()
        if not wallet:
            conn.rollback()
            return jsonify({"error": "wallet not found for customer"}), 404

        lines = []
        for item in parsed_items:
            cur.execute(
                """
                SELECT menu_item_id, price
                FROM menu_item
                WHERE menu_item_id = %s AND stall_id = %s AND is_available = 1
                """,
                (item["menu_item_id"], stall_id),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                return jsonify({"error": f"menu_item {item['menu_item_id']} not available at this stall"}), 400
            unit = Decimal(str(row["price"]))
            lines.append({**item, "unit_price": unit})
            total += unit * item["quantity"]

        total = total.quantize(Decimal("0.01"))
        if total <= 0:
            conn.rollback()
            return jsonify({"error": "total must be positive"}), 400

        new_balance = Decimal(str(wallet["balance"])) - total
        if new_balance < 0:
            conn.rollback()
            return jsonify({"error": "insufficient wallet balance"}), 400

        cur.execute(
            """
            INSERT INTO orders (customer_id, stall_id, status, total_amount)
            VALUES (%s, %s, 'paid', %s)
            """,
            (customer_id, stall_id, total),
        )
        order_id = cur.lastrowid

        for line in lines:
            cur.execute(
                """
                INSERT INTO order_line (order_id, menu_item_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, line["menu_item_id"], line["quantity"], line["unit_price"]),
            )

        cur.execute(
            """
            INSERT INTO payment (order_id, method, amount)
            VALUES (%s, %s, %s)
            """,
            (order_id, method, total),
        )
        cur.execute(
            """
            INSERT INTO ledger_entry (wallet_id, order_id, entry_type, amount)
            VALUES (%s, %s, 'payment', %s)
            """,
            (wallet["wallet_id"], order_id, total),
        )
        cur.execute(
            "UPDATE wallet SET balance = %s WHERE wallet_id = %s",
            (new_balance, wallet["wallet_id"]),
        )
        conn.commit()
        cur.close()
    except Error as exc:
        if conn:
            conn.rollback()
        return jsonify({"error": str(exc)}), 503
    finally:
        if conn:
            conn.close()

    mongo_written = True
    mongo_error = None
    try:
        _write_payment_event(order_id, stall_id, customer_id, total, method)
    except (PyMongoError, RuntimeError) as exc:
        mongo_written = False
        mongo_error = str(exc)

    return jsonify({
        "order_id": order_id,
        "status": "paid",
        "total_amount": float(total),
        "mongo_written": mongo_written,
        "mongo_error": mongo_error,
    }), 201


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000, debug=True)
