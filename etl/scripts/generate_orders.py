"""
generate_orders.py
Owner: LIDEON

Generates fake orders / order_line / payment / ledger_entry rows for
demo + load testing. Iter 2: a few hundred orders. Iter 4: tens of
thousands.

Must follow the exact same rules as the real /orders/pay endpoint:
  - one order = one SQL transaction
  - wallet.balance only ever changes via a ledger_entry insert
  - amount = sum of order_line lines
"""

# TODO: pick libs, e.g. `pip install faker mysql-connector-python`


def generate_order(customer_id: int, stall_id: int) -> int:
    """TODO Lideon:
    1. pick a random handful of that stall's menu_item rows
    2. START TRANSACTION
    3. INSERT INTO orders / order_line / payment / ledger_entry
    4. UPDATE wallet.balance
    5. COMMIT
    Return the new order_id so generate_mongo_events.py can use it.
    """
    raise NotImplementedError


def run(n_orders: int) -> None:
    """TODO Lideon: loop generate_order() n_orders times across random
    customers/stalls. Log generated order_ids somewhere Wileen's script
    can read (a CSV, a table, stdout — your call, just document it in
    etl/README.md)."""
    raise NotImplementedError


if __name__ == "__main__":
    # TODO: run(200) for Iter 2, scale up toward tens of thousands for Iter 4
    pass
