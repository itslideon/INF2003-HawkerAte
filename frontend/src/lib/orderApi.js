// POST /orders/pay (see docs/api-contract.md). The server computes total_amount
// from MariaDB menu prices — never compute it client-side for the order record.

import { apiPost } from './api.js'

// Stopgap: the app's login is fake (customer_id = email) but the API needs a real int
// customer_id that has a wallet in MariaDB. Default 1 is the seeded Test User in
// sql/schema/test_inserts.sql; set VITE_DEMO_CUSTOMER_ID in frontend/.env to use another.
// Replace with the real id once signup exists.
export const DEMO_CUSTOMER_ID = Number(import.meta.env.VITE_DEMO_CUSTOMER_ID) || 1

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
