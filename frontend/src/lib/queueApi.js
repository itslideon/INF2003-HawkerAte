// Stall line: GET /stalls/:id/queue, GET /orders/:id/queue, POST /orders/:id/ready.
// ticket_no is assigned at POST /orders/pay (see data.queue). now_serving_ticket is MIN(ticket_no) still waiting.

import { apiGet, apiPost } from './api.js'

export function getStallQueue(stallId) {
  return apiGet(`/stalls/${stallId}/queue`)
}

export function getOrderQueue(orderId) {
  return apiGet(`/orders/${orderId}/queue`)
}

export function markOrderReady(orderId) {
  return apiPost(`/orders/${orderId}/ready`, {})
}
