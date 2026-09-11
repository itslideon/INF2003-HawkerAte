"""
generate_mongo_events.py
Owner: WILEEN

For every SQL order/payment created by generate_orders.py, insert a
matching payment_events document in Mongo — mirroring the "insert
AFTER MariaDB commit" rule from the real pay path.
"""

# TODO: pip install pymongo


def generate_event_for_order(order_id: int, stall_id: int, customer_id: int,
                              amount: float, method: str) -> None:
    """TODO Wileen: build the right shape of doc depending on method
    (paynow/card/cash have different fields — see
    nosql/models/payment_events.example.json) and insert into
    the `payment_events` collection in the `hawkerate` Mongo DB."""
    raise NotImplementedError


if __name__ == "__main__":
    # TODO: read the order_ids generate_orders.py produced and call
    # generate_event_for_order(...) for each
    pass
