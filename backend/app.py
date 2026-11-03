"""HawkerAte HTTP API. See docs/api-contract.md for request/response shapes."""

from datetime import date, datetime, timezone
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
SPLIT_TYPES = {"equal", "by_item", "custom"}
MONEY = Decimal("0.01")


def as_money(value):
    return Decimal(str(value)).quantize(MONEY)


def _equal_shares(total, customer_ids):
    """Split total across members in cents so shares sum exactly."""
    cents = int((as_money(total) * 100).to_integral_value())
    n = len(customer_ids)
    base, rem = divmod(cents, n)
    shares = []
    for i, cid in enumerate(customer_ids):
        piece = base + (1 if i < rem else 0)
        amount = as_money(Decimal(piece) / 100)
        if amount <= 0:
            raise ValueError("equal split produced a non-positive share")
        shares.append({"customer_id": cid, "share_amount": amount})
    return shares


def _custom_shares(members, total):
    shares = []
    seen = set()
    running = Decimal("0.00")
    for member in members:
        try:
            cid = int(member["customer_id"])
            amount = as_money(member["share_amount"])
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError("each member needs customer_id and share_amount") from exc
        if cid in seen:
            raise ValueError(f"duplicate customer_id {cid}")
        if amount <= 0:
            raise ValueError("share_amount must be positive")
        seen.add(cid)
        running += amount
        shares.append({"customer_id": cid, "share_amount": amount})
    if running != as_money(total):
        raise ValueError(
            f"custom shares {running} must equal order total {as_money(total)}"
        )
    return shares


def _by_item_shares(assignments, lines, total):
    leftover = {int(line["order_line_id"]): int(line["quantity"]) for line in lines}
    price = {
        int(line["order_line_id"]): as_money(line["unit_price"]) for line in lines
    }
    by_customer = {}
    for row in assignments:
        try:
            line_id = int(row["order_line_id"])
            cid = int(row["customer_id"])
            qty = int(row["quantity"])
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(
                "each assignment needs order_line_id, customer_id, quantity"
            ) from exc
        if qty < 1:
            raise ValueError("assignment quantity must be at least 1")
        if line_id not in leftover:
            raise ValueError(f"order_line {line_id} is not on this order")
        leftover[line_id] -= qty
        if leftover[line_id] < 0:
            raise ValueError(f"order_line {line_id} assigned more portions than ordered")
        by_customer[cid] = by_customer.get(cid, Decimal("0.00")) + price[line_id] * qty
    unpaid = [lid for lid, qty in leftover.items() if qty != 0]
    if unpaid:
        raise ValueError("by_item assignments must cover every order line exactly")
    shares = [
        {"customer_id": cid, "share_amount": as_money(amount)}
        for cid, amount in sorted(by_customer.items())
    ]
    if any(s["share_amount"] <= 0 for s in shares):
        raise ValueError("share_amount must be positive")
    running = sum((s["share_amount"] for s in shares), Decimal("0.00"))
    if running != as_money(total):
        raise ValueError(f"by_item shares {running} must equal order total {as_money(total)}")
    return shares


def json_safe(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
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


def _enqueue(cur, stall_id, order_id):
    """Next ticket for this stall. Caller must hold a lock on the stall row."""
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
    return ticket


def _queue_payload(cur, stall_id, order_id, ticket_no):
    cur.execute(
        """
        SELECT COUNT(*) AS n FROM stall_queue
        WHERE stall_id = %s AND ticket_no < %s
        """,
        (stall_id, ticket_no),
    )
    ahead = int(cur.fetchone()["n"])
    cur.execute(
        "SELECT MIN(ticket_no) AS now_serving FROM stall_queue WHERE stall_id = %s",
        (stall_id,),
    )
    now_serving = cur.fetchone()["now_serving"]
    return {
        "stall_id": stall_id,
        "order_id": order_id,
        "ticket_no": ticket_no,
        "ahead": ahead,
        "now_serving_ticket": now_serving,
        "in_queue": True,
    }


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


@app.get("/stalls/<int:stall_id>/takings")
def stall_takings(stall_id):
    """Today's owner totals from v_owner_takings. Zeros if no paid orders yet."""
    try:
        row = fetch_one(
            "SELECT * FROM v_owner_takings WHERE stall_id = %s",
            (stall_id,),
        )
        if not row:
            return jsonify({"error": "stall not found"}), 404
        return jsonify(row)
    except Error as exc:
        return jsonify({"error": str(exc)}), 503


@app.get("/settlement")
def daily_settlement():
    """Paid sales by stall for one day (default today) from v_daily_settlement."""
    day = (request.args.get("date") or "").strip()
    if day:
        try:
            datetime.strptime(day, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "date must be YYYY-MM-DD"}), 400
    try:
        if not day:
            rows = fetch_all(
                "SELECT * FROM v_daily_settlement WHERE order_date = CURDATE() ORDER BY sales_total DESC"
            )
            return jsonify({"date": "today", "stalls": rows})
        rows = fetch_all(
            """
            SELECT * FROM v_daily_settlement
            WHERE order_date = %s
            ORDER BY sales_total DESC
            """,
            (day,),
        )
        return jsonify({"date": day, "stalls": rows})
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


def _write_payment_event(order_id, stall_id, customer_id, amount, method, extras=None):
    """Append-only payment log in Mongo. Called only after the SQL commit.

    extras: optional sgqr / promo_code / device / card_last4 from the request.
    Mongo never rewrites the SQL ledger; this is just an event log.
    """
    extras = extras or {}
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
        doc["card_last4"] = str(extras.get("card_last4") or "0000")[-4:]
    for key in ("sgqr", "promo_code", "device"):
        if extras.get(key):
            doc[key] = str(extras[key])
    get_mongo_db().payment_events.insert_one(doc)


@app.post("/orders/pay")
def pay_order():
    """
    One MariaDB transaction: order, lines, payment, ledger, wallet, stall_queue ticket.
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

    # optional extras that only go to Mongo (SQL schema doesn't store them)
    extras = {k: body.get(k) for k in ("sgqr", "promo_code", "device", "card_last4") if body.get(k)}

    conn = None
    order_id = None
    queue = None
    total = Decimal("0.00")
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()

        cur.execute(
            "SELECT stall_id FROM stall WHERE stall_id = %s AND is_deleted = 0 FOR UPDATE",
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
        ticket_no = _enqueue(cur, stall_id, order_id)
        queue = _queue_payload(cur, stall_id, order_id, ticket_no)
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
        _write_payment_event(order_id, stall_id, customer_id, total, method, extras)
    except (PyMongoError, RuntimeError) as exc:
        mongo_written = False
        mongo_error = str(exc)

    return jsonify({
        "order_id": order_id,
        "status": "paid",
        "total_amount": float(total),
        "mongo_written": mongo_written,
        "mongo_error": mongo_error,
        "queue": queue,
    }), 201


def _write_refund_event(order_id, stall_id, customer_id, amount, method):
    """Append-only refund in Mongo. Called only after the SQL commit.

    Amount is stored negative (Wileen's seed / example). Does not rewrite
    the original payment doc. reversed_event_id is set if that payment event exists.
    """
    db = get_mongo_db()
    original = db.payment_events.find_one({
        "order_id": as_id_str(order_id),
        "event_type": "payment",
    })
    doc = {
        "order_id": as_id_str(order_id),
        "stall_id": as_id_str(stall_id),
        "customer_id": as_id_str(customer_id),
        "amount": -float(amount),
        "method": method,
        "event_type": "refund",
        "created_at": datetime.now(timezone.utc),
    }
    if original:
        doc["reversed_event_id"] = original["_id"]
    db.payment_events.insert_one(doc)


@app.post("/orders/<int:order_id>/refund")
def refund_order(order_id):
    """
    One MariaDB transaction: reversing ledger_entry, wallet credit, order
    refunded, drop stall_queue row. Never DELETE payment or ledger rows.
    Then a payment_events refund document. If Mongo fails, SQL still stands.
    """
    conn = None
    customer_id = None
    stall_id = None
    method = None
    total = Decimal("0.00")
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()
        cur.execute(
            """
            SELECT o.order_id, o.customer_id, o.stall_id, o.status, o.total_amount,
                   p.method, w.wallet_id, w.balance
            FROM orders o
            INNER JOIN payment p ON p.order_id = o.order_id
            INNER JOIN wallet w ON w.customer_id = o.customer_id
            WHERE o.order_id = %s
            FOR UPDATE
            """,
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.rollback()
            cur.execute("SELECT order_id FROM orders WHERE order_id = %s", (order_id,))
            exists = cur.fetchone()
            if not exists:
                return jsonify({"error": "order not found"}), 404
            return jsonify({"error": "order has no payment to refund"}), 400
        if row["status"] == "refunded":
            conn.rollback()
            return jsonify({"error": "order already refunded"}), 409
        if row["status"] != "paid":
            conn.rollback()
            return jsonify({"error": "only paid orders can be refunded"}), 400

        customer_id = row["customer_id"]
        stall_id = row["stall_id"]
        method = row["method"]
        total = Decimal(str(row["total_amount"])).quantize(Decimal("0.01"))
        new_balance = Decimal(str(row["balance"])) + total

        cur.execute(
            """
            INSERT INTO ledger_entry (wallet_id, order_id, entry_type, amount)
            VALUES (%s, %s, 'refund', %s)
            """,
            (row["wallet_id"], order_id, total),
        )
        cur.execute(
            "UPDATE wallet SET balance = %s WHERE wallet_id = %s",
            (new_balance, row["wallet_id"]),
        )
        cur.execute(
            "UPDATE orders SET status = 'refunded' WHERE order_id = %s",
            (order_id,),
        )
        cur.execute(
            "DELETE FROM stall_queue WHERE order_id = %s",
            (order_id,),
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
        _write_refund_event(order_id, stall_id, customer_id, total, method)
    except (PyMongoError, RuntimeError) as exc:
        mongo_written = False
        mongo_error = str(exc)

    return jsonify({
        "order_id": order_id,
        "status": "refunded",
        "refund_amount": float(total),
        "mongo_written": mongo_written,
        "mongo_error": mongo_error,
    })


def _session_payload(cur, session_id):
    """JSON Kristen uses for the Makan split screen."""
    cur.execute(
        """
        SELECT ds.session_id, ds.order_id, ds.split_type, ds.created_at,
               o.customer_id AS organizer_customer_id, o.total_amount, o.stall_id
        FROM dining_session ds
        JOIN orders o ON o.order_id = ds.order_id
        WHERE ds.session_id = %s
        """,
        (session_id,),
    )
    session = cur.fetchone()
    if not session:
        return None
    organizer_id = int(session["organizer_customer_id"])
    cur.execute(
        """
        SELECT session_member_id, customer_id, share_amount, is_settled, settled_at
        FROM session_member
        WHERE session_id = %s
        ORDER BY session_member_id
        """,
        (session_id,),
    )
    members = cur.fetchall()
    member_rows = []
    all_settled = True
    for member in members:
        is_organizer = int(member["customer_id"]) == organizer_id
        settled = bool(member["is_settled"]) or is_organizer
        if not settled:
            all_settled = False
        member_rows.append({
            "session_member_id": member["session_member_id"],
            "customer_id": member["customer_id"],
            "share_amount": float(member["share_amount"]),
            "is_organizer": is_organizer,
            "is_settled": settled,
            "settled_at": json_safe(member["settled_at"]),
        })
    return {
        "product": "Makan split",
        "session_id": session["session_id"],
        "order_id": session["order_id"],
        "stall_id": session["stall_id"],
        "organizer_customer_id": organizer_id,
        "total_amount": float(session["total_amount"]),
        "stall_paid": True,
        "split_type": session["split_type"],
        "created_at": json_safe(session["created_at"]),
        "all_settled": all_settled,
        "members": member_rows,
        "note": "one bill to the stall, settle among friends — wallet to organizer, not another stall pay",
    }


@app.post("/dining-sessions")
def create_dining_session():
    """Split a paid stall order among friends. Does not take another stall payment."""
    body = request.get_json(silent=True) or {}
    try:
        order_id = int(body.get("order_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "order_id must be an integer"}), 400
    split_type = (body.get("split_type") or "").strip().lower()
    if split_type not in SPLIT_TYPES:
        return jsonify({"error": "split_type must be equal, by_item, or custom"}), 400

    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()
        cur.execute(
            """
            SELECT order_id, customer_id, status, total_amount
            FROM orders
            WHERE order_id = %s
            FOR UPDATE
            """,
            (order_id,),
        )
        order = cur.fetchone()
        if not order:
            conn.rollback()
            return jsonify({"error": "order not found"}), 404
        if order["status"] != "paid":
            conn.rollback()
            return jsonify({"error": "only paid orders can be split"}), 400
        cur.execute(
            "SELECT session_id FROM dining_session WHERE order_id = %s",
            (order_id,),
        )
        existing = cur.fetchone()
        if existing:
            conn.rollback()
            return jsonify({
                "error": "order already has a dining session",
                "session_id": existing["session_id"],
            }), 409

        total = as_money(order["total_amount"])
        organizer_id = int(order["customer_id"])

        try:
            if split_type == "equal":
                raw_ids = body.get("customer_ids") or []
                customer_ids = [int(cid) for cid in raw_ids]
                if len(customer_ids) < 2:
                    raise ValueError("equal split needs at least 2 customer_ids")
                if len(set(customer_ids)) != len(customer_ids):
                    raise ValueError("duplicate customer_id")
                shares = _equal_shares(total, customer_ids)
            elif split_type == "custom":
                shares = _custom_shares(body.get("members") or [], total)
            else:
                cur.execute(
                    """
                    SELECT order_line_id, quantity, unit_price
                    FROM order_line
                    WHERE order_id = %s
                    """,
                    (order_id,),
                )
                lines = cur.fetchall()
                shares = _by_item_shares(body.get("assignments") or [], lines, total)
        except (TypeError, ValueError) as exc:
            conn.rollback()
            return jsonify({"error": str(exc)}), 400

        member_ids = [s["customer_id"] for s in shares]
        if organizer_id not in member_ids:
            conn.rollback()
            return jsonify({
                "error": "organizer (order customer_id) must be a session member",
            }), 400
        placeholders = ",".join(["%s"] * len(member_ids))
        cur.execute(
            f"SELECT customer_id FROM customer WHERE customer_id IN ({placeholders})",
            tuple(member_ids),
        )
        found = {int(r["customer_id"]) for r in cur.fetchall()}
        missing = [cid for cid in member_ids if cid not in found]
        if missing:
            conn.rollback()
            return jsonify({"error": f"unknown customer_id {missing[0]}"}), 400

        cur.execute(
            """
            INSERT INTO dining_session (order_id, split_type)
            VALUES (%s, %s)
            """,
            (order_id, split_type),
        )
        session_id = cur.lastrowid
        for share in shares:
            is_org = int(share["customer_id"]) == organizer_id
            cur.execute(
                """
                INSERT INTO session_member
                    (session_id, customer_id, share_amount, is_settled, settled_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    session_id,
                    share["customer_id"],
                    share["share_amount"],
                    1 if is_org else 0,
                    datetime.now(timezone.utc).replace(tzinfo=None) if is_org else None,
                ),
            )
        conn.commit()
        payload = _session_payload(cur, session_id)
        cur.close()
    except Error as exc:
        if conn:
            conn.rollback()
        msg = str(exc)
        if "dining_session" in msg.lower() and "exist" in msg.lower():
            return jsonify({"error": "apply sql/schema/03_split.sql"}), 503
        return jsonify({"error": msg}), 503
    finally:
        if conn:
            conn.close()

    return jsonify(payload), 201


@app.get("/dining-sessions/<int:session_id>")
def get_dining_session(session_id):
    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        payload = _session_payload(cur, session_id)
        cur.close()
    except Error as exc:
        return jsonify({"error": str(exc)}), 503
    finally:
        if conn:
            conn.close()
    if not payload:
        return jsonify({"error": "session not found"}), 404
    return jsonify(payload)


@app.get("/orders/<int:order_id>/dining-session")
def dining_session_for_order(order_id):
    """Lookup Makan split after pay — Kristen can GET this with the order_id."""
    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT session_id FROM dining_session WHERE order_id = %s",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            return jsonify({"error": "no makan split for this order"}), 404
        payload = _session_payload(cur, row["session_id"])
        cur.close()
    except Error as exc:
        return jsonify({"error": str(exc)}), 503
    finally:
        if conn:
            conn.close()
    if not payload:
        return jsonify({"error": "session not found"}), 404
    return jsonify(payload)


@app.post("/dining-sessions/<int:session_id>/settle")
def settle_dining_session(session_id):
    """Friend pays their share to the organizer wallet. Not a stall checkout."""
    body = request.get_json(silent=True) or {}
    try:
        customer_id = int(body.get("customer_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "customer_id must be an integer"}), 400

    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()
        cur.execute(
            """
            SELECT ds.session_id, ds.order_id, o.customer_id AS organizer_id
            FROM dining_session ds
            JOIN orders o ON o.order_id = ds.order_id
            WHERE ds.session_id = %s
            FOR UPDATE
            """,
            (session_id,),
        )
        session = cur.fetchone()
        if not session:
            conn.rollback()
            return jsonify({"error": "session not found"}), 404
        organizer_id = int(session["organizer_id"])
        if customer_id == organizer_id:
            conn.rollback()
            return jsonify({
                "error": "organizer already paid the stall; nothing to settle",
            }), 400

        cur.execute(
            """
            SELECT session_member_id, customer_id, share_amount, is_settled
            FROM session_member
            WHERE session_id = %s AND customer_id = %s
            FOR UPDATE
            """,
            (session_id, customer_id),
        )
        member = cur.fetchone()
        if not member:
            conn.rollback()
            return jsonify({"error": "customer is not in this makan split"}), 404
        if member["is_settled"]:
            conn.rollback()
            return jsonify({"error": "share already settled"}), 409

        share = as_money(member["share_amount"])
        cur.execute(
            "SELECT wallet_id, balance FROM wallet WHERE customer_id = %s FOR UPDATE",
            (customer_id,),
        )
        friend_wallet = cur.fetchone()
        cur.execute(
            "SELECT wallet_id, balance FROM wallet WHERE customer_id = %s FOR UPDATE",
            (organizer_id,),
        )
        org_wallet = cur.fetchone()
        if not friend_wallet or not org_wallet:
            conn.rollback()
            return jsonify({"error": "both organizer and friend need a wallet"}), 400
        friend_bal = as_money(friend_wallet["balance"])
        if friend_bal < share:
            conn.rollback()
            return jsonify({"error": "insufficient wallet balance"}), 400

        order_id = session["order_id"]
        cur.execute(
            """
            INSERT INTO ledger_entry (wallet_id, order_id, entry_type, amount)
            VALUES (%s, %s, 'split_settle', %s)
            """,
            (friend_wallet["wallet_id"], order_id, share),
        )
        cur.execute(
            "UPDATE wallet SET balance = %s WHERE wallet_id = %s",
            (friend_bal - share, friend_wallet["wallet_id"]),
        )
        cur.execute(
            """
            INSERT INTO ledger_entry (wallet_id, order_id, entry_type, amount)
            VALUES (%s, %s, 'split_settle', %s)
            """,
            (org_wallet["wallet_id"], order_id, share),
        )
        cur.execute(
            "UPDATE wallet SET balance = %s WHERE wallet_id = %s",
            (as_money(org_wallet["balance"]) + share, org_wallet["wallet_id"]),
        )
        cur.execute(
            """
            UPDATE session_member
            SET is_settled = 1, settled_at = %s
            WHERE session_member_id = %s
            """,
            (datetime.now(timezone.utc).replace(tzinfo=None), member["session_member_id"]),
        )
        conn.commit()
        payload = _session_payload(cur, session_id)
        cur.close()
    except Error as exc:
        if conn:
            conn.rollback()
        return jsonify({"error": str(exc)}), 503
    finally:
        if conn:
            conn.close()

    return jsonify(payload)


# ---------------------------------------------------------------------------
# Mongo payment_events analytics (Wileen)
# ---------------------------------------------------------------------------

@app.get("/analytics/payments/by-stall")
def payments_by_stall():
    """Total + count of payment events per stall, straight from Mongo."""
    try:
        docs = list(get_mongo_db().payment_events.aggregate([
            {"$match": {"event_type": "payment"}},
            {"$group": {
                "_id": "$stall_id",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }},
            {"$sort": {"total": -1}},
        ]))
    except (PyMongoError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 503
    return jsonify([
        {"stall_id": d["_id"], "total": round(d["total"], 2), "count": d["count"]}
        for d in docs
    ])


@app.get("/analytics/payments/by-method")
def payments_by_method():
    """Total + count per payment method. Optional ?stall_id= to filter one stall."""
    match = {"event_type": "payment"}
    stall_id = request.args.get("stall_id")
    if stall_id:
        match["stall_id"] = as_id_str(stall_id)
    try:
        docs = list(get_mongo_db().payment_events.aggregate([
            {"$match": match},
            {"$group": {
                "_id": "$method",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }},
            {"$sort": {"total": -1}},
        ]))
    except (PyMongoError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 503
    return jsonify([
        {"method": d["_id"], "total": round(d["total"], 2), "count": d["count"]}
        for d in docs
    ])


@app.get("/analytics/payments/reconcile")
def payments_reconcile():
    """Mongo totals vs MariaDB SUM(payment.amount) per stall. SQL is the source of truth."""
    try:
        sql_rows = fetch_all(
            """
            SELECT o.stall_id, SUM(p.amount) AS total, COUNT(*) AS n
            FROM payment p
            JOIN orders o ON o.order_id = p.order_id
            GROUP BY o.stall_id
            """
        )
    except Error as exc:
        return jsonify({"error": str(exc)}), 503

    try:
        mongo_docs = list(get_mongo_db().payment_events.aggregate([
            {"$match": {"event_type": "payment"}},
            {"$group": {"_id": "$stall_id", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        ]))
    except (PyMongoError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 503

    sql_by_stall = {as_id_str(r["stall_id"]): r for r in sql_rows}
    mongo_by_stall = {d["_id"]: d for d in mongo_docs}

    result = []
    all_ok = True
    for sid in sorted(set(sql_by_stall) | set(mongo_by_stall), key=lambda s: int(s) if s.isdigit() else s):
        sql_total = round(float(sql_by_stall[sid]["total"]), 2) if sid in sql_by_stall else 0.0
        sql_n = int(sql_by_stall[sid]["n"]) if sid in sql_by_stall else 0
        m_total = round(float(mongo_by_stall[sid]["total"]), 2) if sid in mongo_by_stall else 0.0
        m_n = int(mongo_by_stall[sid]["count"]) if sid in mongo_by_stall else 0
        match = abs(sql_total - m_total) < 0.005 and sql_n == m_n
        all_ok = all_ok and match
        result.append({
            "stall_id": sid,
            "sql_total": sql_total,
            "sql_count": sql_n,
            "mongo_total": m_total,
            "mongo_count": m_n,
            "match": match,
        })
    return jsonify({"all_match": all_ok, "stalls": result})


@app.get("/stalls/<int:stall_id>/queue")
def stall_queue(stall_id):
    """Line for one stall: now serving = smallest ticket still waiting."""
    try:
        if not fetch_one(
            "SELECT stall_id FROM stall WHERE stall_id = %s AND is_deleted = 0",
            (stall_id,),
        ):
            return jsonify({"error": "stall not found"}), 404
        rows = fetch_all(
            """
            SELECT order_id, ticket_no, customer_id
            FROM stall_queue q
            JOIN orders o USING (order_id)
            WHERE q.stall_id = %s
            ORDER BY ticket_no
            """,
            (stall_id,),
        )
    except Error as exc:
        return jsonify({"error": str(exc)}), 503
    now_serving = rows[0]["ticket_no"] if rows else None
    return jsonify({
        "stall_id": stall_id,
        "now_serving_ticket": now_serving,
        "waiting": len(rows),
        "line": rows,
    })


@app.get("/orders/<int:order_id>/queue")
def order_queue(order_id):
    """This order's ticket, how many ahead, and who is now serving."""
    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT stall_id, status FROM orders WHERE order_id = %s
            """,
            (order_id,),
        )
        order = cur.fetchone()
        if not order:
            return jsonify({"error": "order not found"}), 404
        cur.execute(
            "SELECT ticket_no FROM stall_queue WHERE order_id = %s",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({
                "order_id": order_id,
                "stall_id": order["stall_id"],
                "in_queue": False,
            })
        payload = _queue_payload(cur, order["stall_id"], order_id, int(row["ticket_no"]))
        cur.close()
        return jsonify(payload)
    except Error as exc:
        return jsonify({"error": str(exc)}), 503
    finally:
        if conn:
            conn.close()


@app.post("/orders/<int:order_id>/ready")
def order_ready(order_id):
    """Leave the stall line (food collected / now serving moves on)."""
    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()
        cur.execute(
            "SELECT stall_id FROM orders WHERE order_id = %s FOR UPDATE",
            (order_id,),
        )
        order = cur.fetchone()
        if not order:
            conn.rollback()
            return jsonify({"error": "order not found"}), 404
        cur.execute(
            "DELETE FROM stall_queue WHERE order_id = %s",
            (order_id,),
        )
        left = cur.rowcount
        conn.commit()
        cur.close()
        if not left:
            return jsonify({
                "ok": True,
                "order_id": order_id,
                "in_queue": False,
                "already_left": True,
            })
        return jsonify({"ok": True, "order_id": order_id, "in_queue": False})
    except Error as exc:
        if conn:
            conn.rollback()
        return jsonify({"error": str(exc)}), 503
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000, debug=True)