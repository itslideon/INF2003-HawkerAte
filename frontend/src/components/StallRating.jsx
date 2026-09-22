import { useEffect, useState } from 'react'
import { getStallRating } from '../lib/reviewsApi.js'

// Shows the real average rating once GET /stalls/:id/reviews exists (see
// src/lib/reviewsApi.js); until then it stays quiet rather than showing a
// fake "★ 4.8" like the old copy did.
export default function StallRating({ stallId, className = '' }) {
  const [rating, setRating] = useState(undefined) // undefined = loading, null = unavailable

  useEffect(() => {
    let cancelled = false
    setRating(undefined)
    getStallRating(stallId).then((result) => {
      if (!cancelled) setRating(result)
    })
    return () => {
      cancelled = true
    }
  }, [stallId])

  if (!rating) return null // loading or no backend yet — say nothing rather than guess

  return (
    <span className={className}>
      ★ {rating.average.toFixed(1)}
      {rating.count > 0 ? ` (${rating.count})` : ''}
    </span>
  )
}
