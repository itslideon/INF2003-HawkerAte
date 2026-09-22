// Reads the stall rating Wileen's Mongo `reviews` collection backs (see
// nosql/README.md, nosql/aggregations/by_stall.js). There is no HTTP endpoint
// for this yet — only Python/mongosh scripts that talk to Mongo directly, which
// the browser can't call. `GET /stalls/:id/reviews` below is a *proposed* shape,
// drafted in docs/api-contract.md, for Lideon to confirm and build. Until it
// exists, apiGet() returns null and getStallRating() reports "unavailable" so
// the UI shows a waiting state instead of a made-up number.
//
// Field names/types follow nosql/setup_collections.py: stall_id is a string
// (matches Wileen's seed data, e.g. "17"), rating is an int 1-5.

import { apiGet } from './api.js'

export async function getStallRating(stallId) {
  const data = await apiGet(`/stalls/${stallId}/reviews`)
  if (!data || typeof data.average_rating !== 'number') return null
  return { average: data.average_rating, count: data.review_count ?? 0 }
}
