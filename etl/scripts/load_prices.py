"""
load_prices.py
Owner: LANCEA

Uses SingStat CPI / price data (dataset 4) to generate realistic
menu_item.price values per cuisine_type, instead of random numbers.

Run AFTER load_centres_stalls.py has created stalls.
"""

# TODO: pip install whatever CSV/Excel lib you need for the SingStat export


def load_price_reference(path: str) -> dict:
    """TODO Lancea: parse the SingStat export into a {cuisine_type: price_range} map."""
    raise NotImplementedError


def generate_menu_items_for_stalls() -> None:
    """TODO Lancea: for each stall, insert a handful of menu_item rows with
    prices drawn from the reference ranges above. Respect price > 0."""
    raise NotImplementedError


if __name__ == "__main__":
    # TODO: call load_price_reference(...) then generate_menu_items_for_stalls()
    pass
