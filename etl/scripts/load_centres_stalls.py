"""
load_centres_stalls.py
Owner: LANCEA

Loads NEA hawker centre data (dataset 1) + GeoJSON (dataset 2) into the
hawker_centre table, and seeds first stalls from NEA stall counts.

Run AFTER sql/schema/01_core.sql has been applied.
"""

# TODO: pick a MariaDB driver, e.g. `pip install mysql-connector-python`
# import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",  # TODO: load from .env, don't commit real creds
    "database": "hawkerate",
}


def load_centres(csv_path: str) -> None:
    """TODO Lancea: read the NEA centres CSV (dataset 1) and
    INSERT INTO hawker_centre (name, address, postal_code, stall_count, ...)."""
    raise NotImplementedError


def load_geojson(geojson_path: str) -> None:
    """TODO Lancea: read the NEA GeoJSON (dataset 2) and UPDATE hawker_centre
    with latitude/longitude/postal_code, matched by name or postal code."""
    raise NotImplementedError


def seed_stalls_from_counts() -> None:
    """TODO Lancea: for each hawker_centre.stall_count, generate that many
    placeholder stall rows (real names can come later from generate_orders.py's
    menu generation, or a second pass)."""
    raise NotImplementedError


if __name__ == "__main__":
    # TODO: wire up paths (etl/raw/...) and call the functions above in order
    pass
