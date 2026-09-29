// Wraps the Iter 1 browse endpoints backend/app.py actually serves (see
// docs/api-contract.md). apiGet() already resolves to null on any failure —
// no backend configured, backend down, or a bad response — so callers just
// treat null as "not available yet" and show a waiting state.

import { apiGet } from './api.js'

export function getCentres() {
  return apiGet('/centres')
}

export function getStalls(centreId) {
  return apiGet(`/centres/${centreId}/stalls`)
}

export function getMenu(stallId) {
  return apiGet(`/stalls/${stallId}/menu`)
}
