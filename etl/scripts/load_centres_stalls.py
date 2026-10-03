"""
load_centres_stalls.py
Owner: LANCEA

Loads NEA hawker centre data (dataset 1) + GeoJSON (dataset 2) into the
hawker_centre table, and seeds first stalls from NEA cooked-food stall counts.

Run AFTER sql/schema/01_core.sql has been applied.
Re-run is safe: centres already present by name are skipped; stalls are
only added when that centre currently has none.
"""

from __future__ import annotations

import csv
import json
import os
import re
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = REPO_ROOT / "etl" / "raw"
CSV_PATH = RAW_DIR / "d_68a42f09f350881996d83f9cd73ab02f.csv"
GEOJSON_PATH = RAW_DIR / "d_4a086da0a5553be1d89383cd90d07ecd.geojson"

# Iter 1: enough stalls for Kristen to browse, not 6k dummy rows.
STALLS_PER_CENTRE_CAP = 8

POSTAL_RE = re.compile(r"S\((\d+)\)", re.IGNORECASE)

load_dotenv(REPO_ROOT / ".env")


def get_conn():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "hawkerate"),
    )


def norm_name(value: str) -> str:
    return " ".join((value or "").lower().split())


def postal_from_address(address: str) -> str | None:
    match = POSTAL_RE.search(address or "")
    return match.group(1) if match else None


def load_centres(csv_path: str) -> None:
    """Read the NEA centres CSV and INSERT into hawker_centre."""
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"Missing CSV: {path}")

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT name FROM hawker_centre")
        existing = {norm_name(row[0]) for row in cur.fetchall()}

        inserted = 0
        skipped = 0
        with path.open(encoding="utf-8", newline="") as handle:
            for row in csv.DictReader(handle):
                name = (row.get("name_of_centre") or "").strip()
                address = (row.get("location_of_centre") or "").strip()
                if not name or not address:
                    continue
                if norm_name(name) in existing:
                    skipped += 1
                    continue
                cur.execute(
                    """
                    INSERT INTO hawker_centre (name, address, postal_code)
                    VALUES (%s, %s, %s)
                    """,
                    (name, address, postal_from_address(address)),
                )
                existing.add(norm_name(name))
                inserted += 1
        conn.commit()
        print(f"hawker_centre: inserted {inserted}, skipped existing {skipped}")
    finally:
        cur.close()
        conn.close()


def load_geojson(geojson_path: str) -> None:
    """UPDATE hawker_centre lat/long (and postal if missing) from NEA GeoJSON."""
    path = Path(geojson_path)
    if not path.exists():
        raise FileNotFoundError(f"Missing GeoJSON: {path}")

    data = json.loads(path.read_text(encoding="utf-8"))
    by_name = {}
    by_postal = {}
    for feature in data.get("features", []):
        props = feature.get("properties") or {}
        geom = feature.get("geometry") or {}
        coords = geom.get("coordinates") or []
        if geom.get("type") != "Point" or len(coords) < 2:
            continue
        lng, lat = coords[0], coords[1]
        postal = str(props.get("ADDRESSPOSTALCODE") or "").strip() or None
        payload = (lat, lng, postal)
        name = norm_name(props.get("NAME") or "")
        if name:
            by_name[name] = payload
        if postal:
            by_postal[postal] = payload

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT centre_id, name, postal_code, latitude, longitude FROM hawker_centre"
        )
        updated = 0
        unmatched = 0
        for centre in cur.fetchall():
            match = by_name.get(norm_name(centre["name"]))
            if match is None and centre["postal_code"]:
                match = by_postal.get(str(centre["postal_code"]))
            if match is None:
                unmatched += 1
                continue
            lat, lng, postal = match
            cur.execute(
                """
                UPDATE hawker_centre
                SET latitude = %s,
                    longitude = %s,
                    postal_code = COALESCE(NULLIF(postal_code, ''), %s)
                WHERE centre_id = %s
                """,
                (lat, lng, postal, centre["centre_id"]),
            )
            updated += 1
        conn.commit()
        print(f"hawker_centre geo: updated {updated}, no GeoJSON match {unmatched}")
    finally:
        cur.close()
        conn.close()


def seed_stalls_from_counts(csv_path: str = str(CSV_PATH)) -> None:
    """Insert placeholder stalls from NEA cooked-food counts (capped per centre)."""
    path = Path(csv_path)
    counts = {}
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            name = (row.get("name_of_centre") or "").strip()
            try:
                cooked = int(row.get("no_of_cooked_food_stalls") or 0)
            except ValueError:
                cooked = 0
            if name:
                counts[norm_name(name)] = cooked

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT centre_id, name FROM hawker_centre")
        centres = cur.fetchall()

        seeded_centres = 0
        seeded_stalls = 0
        skipped = 0
        for centre_id, name in centres:
            cur.execute(
                "SELECT COUNT(*) FROM stall WHERE centre_id = %s AND is_deleted = 0",
                (centre_id,),
            )
            if cur.fetchone()[0] > 0:
                skipped += 1
                continue
            n = min(max(counts.get(norm_name(name), 0), 0), STALLS_PER_CENTRE_CAP)
            if n == 0:
                n = 1
            for i in range(1, n + 1):
                cur.execute(
                    """
                    INSERT INTO stall (centre_id, name, cuisine_type, grade)
                    VALUES (%s, %s, NULL, NULL)
                    """,
                    (centre_id, f"Stall {i}"),
                )
                seeded_stalls += 1
            seeded_centres += 1
        conn.commit()
        print(
            f"stall: inserted {seeded_stalls} across {seeded_centres} centres "
            f"(cap {STALLS_PER_CENTRE_CAP}/centre); skipped {skipped} already seeded"
        )
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    load_centres(str(CSV_PATH))
    load_geojson(str(GEOJSON_PATH))
    seed_stalls_from_counts()
    print("done")
