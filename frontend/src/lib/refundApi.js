// POST /orders/:id/refund (docs/api-contract.md): one MariaDB transaction adds a reversing
// ledger entry, credits the customer's wallet, marks the order refunded and drops it from the
// stall queue. Nothing is deleted. Resolves to { ok, status, data | error }.
//   ok data:  { order_id, status: 'refunded', refund_amount, mongo_written }
//   errors:   404 order not found, 400 not refundable, 409 already refunded

import { apiRequest } from './api.js'

export function refundOrder(orderId) {
  return apiRequest(`/orders/${orderId}/refund`, { method: 'POST' })
}
