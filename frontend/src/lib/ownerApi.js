// Owner totals from Lancea's MariaDB views (docs/api-contract.md).
// Callers must show zeros / empty copy — never invent a sales number.

import { apiGet } from './api.js'

export function getStallTakings(stallId) {
  return apiGet(`/stalls/${stallId}/takings`)
}

export function getSettlement(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return apiGet(`/settlement${query}`)
}
