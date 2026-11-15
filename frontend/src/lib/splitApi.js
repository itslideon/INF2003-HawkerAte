// Makan split (docs/api-contract.md, "Split"): the stall is already paid by POST /orders/pay,
// this only records who owes the organizer. Friends settle wallet -> organizer; none of this
// is a second stall checkout. Every call resolves to { ok, status, data | error }.

import { apiRequest } from './api.js'

// 404 here just means "this order has no Makan split yet" — callers check status === 404.
export function getOrderSession(orderId) {
  return apiRequest(`/orders/${orderId}/dining-session`)
}

// equal:   { order_id, split_type: 'equal', customer_ids: [organizer, friend, ...] }
// custom:  { order_id, split_type: 'custom', members: [{ customer_id, share_amount }, ...] }
// by_item: needs real order_line_ids, which the API doesn't return yet — not used by the UI.
export function createSession(body) {
  return apiRequest('/dining-sessions', { method: 'POST', body })
}

export function settleShare(sessionId, customerId) {
  return apiRequest(`/dining-sessions/${sessionId}/settle`, {
    method: 'POST',
    body: { customer_id: customerId },
  })
}
