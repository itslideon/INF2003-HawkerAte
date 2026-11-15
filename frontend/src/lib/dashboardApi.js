// Centre admin + investor reads (docs/api-contract.md):
//   GET /centres/:id/admin-summary -> { centre_id, centre_name, ratings_available, stalls: [...] }
//   GET /investor/rank             -> { centres: [...] }
// Both resolve to { ok, status, data | error }. Note admin-summary can take ~5s when Mongo
// is down (the backend waits for it before answering), so callers need a loading state.

import { apiRequest } from './api.js'

export function getAdminSummary(centreId) {
  return apiRequest(`/centres/${centreId}/admin-summary`)
}

export function getInvestorRank() {
  return apiRequest('/investor/rank')
}
