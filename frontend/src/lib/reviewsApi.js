// GET /stalls/:id/reviews — average rating and count from Mongo.

import { apiGet } from './api.js'

export async function getStallRating(stallId) {
  const data = await apiGet(`/stalls/${stallId}/reviews`)
  if (!data || typeof data.average_rating !== 'number') return null
  return { average: data.average_rating, count: data.review_count ?? 0 }
}
