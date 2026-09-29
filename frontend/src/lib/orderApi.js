// POST /orders/pay (see docs/api-contract.md). The server computes total_amount
// from MariaDB menu prices — never compute it client-side for the order record.

import { apiPost } from './api.js'

export function payOrder({ customerId, stallId, basketEntries, method }) {
  return apiPost('/orders/pay', {
    customer_id: customerId,
    stall_id: stallId,
    items: basketEntries.map(({ dish, quantity }) => ({
      menu_item_id: dish.menu_item_id,
      quantity,
    })),
    method,
  })
}
