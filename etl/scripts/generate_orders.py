"""
Build sample orders for demos and load tests.

Uses the same rules as POST /orders/pay: one SQL transaction per order,
wallet updates only via ledger_entry, total = sum of order lines.
Writes order ids to etl/raw/generated_orders.csv for the Mongo event loader.
"""


def generate_order(customer_id: int, stall_id: int) -> int:
    """Insert one paid order; return order_id. Not implemented yet."""
    raise NotImplementedError


def run(n_orders: int) -> None:
    """Insert n_orders across existing customers and stalls.

    Write generated order_ids to etl/raw/generated_orders.csv so
    generate_mongo_events.py can load matching payment_events.
    """
    raise NotImplementedError


if __name__ == "__main__":
    pass
