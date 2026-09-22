// stand-in for POST /orders/pay until that's live — orders just sit in localStorage
// for now. swap the two functions below for real fetch calls when it ships, everything
// else that calls them stays the same. field names already match Lideon's schema.

const ORDERS_KEY_PREFIX = 'hawkerate.orders.'

// `value` matches payment.method in Lideon's schema (ENUM paynow/card/cash) — that's what
// POST /orders/pay will expect. Payments are simulated, so no card/bank details are collected.
export const PAYMENT_METHODS = [
  { value: 'paynow', label: 'PayNow', hint: 'Scan the QR with your banking app (simulated)' },
  { value: 'card', label: 'Card', hint: 'Debit or credit card (simulated, no card details needed)' },
  { value: 'cash', label: 'Cash', hint: 'Pay at the stall counter when you collect' },
]

export function paymentMethodLabel(value) {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value
}

// stand-in for the backend telling us the food is ready. the contract has no "ready" state
// yet (orders.status is only pending/paid/cancelled/refunded), so until Lideon adds one the
// order is marked ready locally after this delay. short on purpose so the demo shows it.
export const MOCK_READY_DELAY_MS = 20_000

export function generateOrderId() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `HA-${Date.now().toString(36).toUpperCase()}${random}`
}

export function buildOrderLines(orderId, basketEntries) {
  return basketEntries.map(({ dish, quantity }, index) => ({
    order_line_id: `${orderId}-L${index + 1}`,
    menu_item_id: dish.menu_item_id,
    name: dish.name,
    quantity,
    unit_price: dish.price,
  }))
}

export function saveOrderForUser(customerId, order) {
  const key = `${ORDERS_KEY_PREFIX}${customerId}`
  try {
    const existing = JSON.parse(localStorage.getItem(key) ?? '[]')
    localStorage.setItem(key, JSON.stringify([order, ...existing]))
  } catch {
    // e.g. private browsing — order still goes through, just doesn't stick around
  }
}

export function getOrdersForUser(customerId) {
  try {
    return JSON.parse(localStorage.getItem(`${ORDERS_KEY_PREFIX}${customerId}`) ?? '[]')
  } catch {
    return []
  }
}

export function updateOrderStatus(customerId, orderId, status) {
  const key = `${ORDERS_KEY_PREFIX}${customerId}`
  try {
    const existing = JSON.parse(localStorage.getItem(key) ?? '[]')
    localStorage.setItem(
      key,
      JSON.stringify(existing.map((order) => (order.order_id === orderId ? { ...order, status } : order))),
    )
  } catch {
    // storage unavailable — the in-memory status still updates
  }
}
