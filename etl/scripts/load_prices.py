"""
load_prices.py
Owner: LANCEA

Uses SingStat CPI (hawker-centre series, 2024=100) to scale realistic
menu_item prices by cuisine_type, instead of random numbers.

Run AFTER load_centres_stalls.py has created stalls.
Re-run is safe: stalls that already have menu rows are skipped.
"""

from __future__ import annotations

import csv
import json
import os
import urllib.request
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = REPO_ROOT / "etl" / "raw"
CPI_PATH = RAW_DIR / "singstat_cpi.csv"
CPI_DATASET_ID = "d_bdaff844e3ef89d39fceb962ff8f0791"
CPI_SOURCE = (
    "https://data.gov.sg/datasets/d_bdaff844e3ef89d39fceb962ff8f0791/view"
)
HAWKER_SERIES = "Hawker Centres"
MONTH_NUM = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "Jun": 6,
    "Jul": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12,
}
USER_AGENT = "HawkerAte-INF2003 (SIT student project)"

# 2024=100 dish prices (SGD). load_price_reference() multiplies by latest
# hawker-centre CPI / 100 so menus move with official price levels.
MENU_BY_CUISINE: dict[str, list[tuple[str, str]]] = {
    "Chinese": [
        ("Hainanese Chicken Rice", "5.80"),
        ("Char Kway Teow", "6.20"),
        ("Wanton Mee", "5.50"),
        ("Economic Rice (3 dishes)", "4.80"),
        ("Kopi", "1.50"),
    ],
    "Malay": [
        ("Nasi Lemak", "4.50"),
        ("Mee Rebus", "5.20"),
        ("Satay (10 sticks)", "8.00"),
        ("Mee Siam", "4.80"),
        ("Teh", "1.50"),
    ],
    "Indian": [
        ("Prata (2 pieces)", "3.20"),
        ("Chicken Biryani", "7.50"),
        ("Fish Head Curry (small)", "9.50"),
        ("Mee Goreng", "5.50"),
        ("Teh Tarik", "1.80"),
    ],
    "Western": [
        ("Fish and Chips", "8.50"),
        ("Chicken Chop", "8.00"),
        ("Spaghetti", "6.50"),
        ("Mixed Grill", "9.80"),
        ("Soft Drink", "1.80"),
    ],
    "Drinks": [
        ("Kopi", "1.40"),
        ("Teh", "1.40"),
        ("Kopi C", "1.60"),
        ("Iced Milo", "2.20"),
        ("Soft Drink", "1.80"),
    ],
}
CUISINES = list(MENU_BY_CUISINE.keys())

load_dotenv(REPO_ROOT / ".env")


def get_conn():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "hawkerate"),
    )


def month_sort_key(col: str) -> tuple[int, int]:
    return (int(col[:4]), MONTH_NUM.get(col[4:], 0))


def money(value: Decimal) -> Decimal:
    if value < Decimal("0.50"):
        value = Decimal("0.50")
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _http_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode())


def download_cpi_extract(dest: Path = CPI_PATH) -> Path:
    """Save a slim SingStat CPI extract (DataSeries + recent months) into etl/raw/."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    offset = 0
    total = None
    while True:
        url = (
            "https://data.gov.sg/api/action/datastore_search"
            f"?resource_id={CPI_DATASET_ID}&limit=100&offset={offset}"
        )
        payload = _http_json(url)
        result = payload["result"]
        records = result["records"]
        rows.extend(records)
        total = result["total"]
        offset += 100
        if offset >= total or not records:
            break

    month_cols = [
        key
        for key in rows[0].keys()
        if len(key) >= 5 and key[:4].isdigit() and key not in {"_id"}
    ]
    month_cols = sorted(month_cols, key=month_sort_key, reverse=True)[:6]
    fieldnames = ["DataSeries", *month_cols]
    with dest.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in fieldnames})
    print(f"wrote {dest.name} ({len(rows)} series) from {CPI_SOURCE}")
    return dest


def latest_hawker_cpi(path: Path) -> tuple[Decimal, str]:
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        month_cols = sorted(
            [c for c in (reader.fieldnames or []) if c != "DataSeries"],
            key=month_sort_key,
            reverse=True,
        )
        for row in reader:
            if (row.get("DataSeries") or "").strip() == HAWKER_SERIES:
                for col in month_cols:
                    raw = (row.get(col) or "").strip()
                    if not raw:
                        continue
                    try:
                        return Decimal(raw), col
                    except Exception:
                        continue
    raise RuntimeError(f"No numeric CPI for '{HAWKER_SERIES}' in {path}")


def load_price_reference(path: str) -> dict:
    """Parse the SingStat CPI extract into cuisine -> [(dish, scaled_price)]."""
    cpi_path = Path(path)
    if not cpi_path.exists():
        download_cpi_extract(cpi_path)
    index, month = latest_hawker_cpi(cpi_path)
    scale = index / Decimal("100")
    print(f"hawker CPI {index} ({month}, 2024=100); scale={scale}")
    priced: dict[str, list[tuple[str, Decimal]]] = {}
    for cuisine, dishes in MENU_BY_CUISINE.items():
        priced[cuisine] = [
            (name, money(Decimal(base) * scale)) for name, base in dishes
        ]
    return priced


def cuisine_for_stall(stall_id: int) -> str:
    return CUISINES[(stall_id - 1) % len(CUISINES)]


def generate_menu_items_for_stalls(reference: dict | None = None) -> None:
    """Insert a handful of menu_item rows per stall. Respect price > 0."""
    if reference is None:
        reference = load_price_reference(str(CPI_PATH))

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT stall_id, cuisine_type FROM stall WHERE is_deleted = 0 ORDER BY stall_id"
        )
        stalls = cur.fetchall()
        updated_cuisine = 0
        seeded_stalls = 0
        seeded_items = 0
        skipped = 0
        for stall_id, cuisine_type in stalls:
            cur.execute(
                "SELECT COUNT(*) FROM menu_item WHERE stall_id = %s",
                (stall_id,),
            )
            if cur.fetchone()[0] > 0:
                skipped += 1
                continue
            cuisine = (cuisine_type or "").strip() or cuisine_for_stall(stall_id)
            if cuisine not in reference:
                cuisine = cuisine_for_stall(stall_id)
            if not cuisine_type:
                cur.execute(
                    "UPDATE stall SET cuisine_type = %s WHERE stall_id = %s",
                    (cuisine, stall_id),
                )
                updated_cuisine += 1
            for name, price in reference[cuisine]:
                cur.execute(
                    """
                    INSERT INTO menu_item (stall_id, name, price, is_available)
                    VALUES (%s, %s, %s, 1)
                    """,
                    (stall_id, name, str(price)),
                )
                seeded_items += 1
            seeded_stalls += 1
        conn.commit()
        print(
            f"menu_item: inserted {seeded_items} on {seeded_stalls} stalls; "
            f"set cuisine_type on {updated_cuisine}; skipped {skipped} already filled"
        )
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    prices = load_price_reference(str(CPI_PATH))
    generate_menu_items_for_stalls(prices)
    print("done")
