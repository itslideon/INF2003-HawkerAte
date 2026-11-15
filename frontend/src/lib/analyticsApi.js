import { useEffect, useState } from 'react'
import { apiGet } from './api.js'

const POLL_MS = 30000

// Mongo payment_events analytics (Wileen's routes in docs/api-contract.md). Both answer 503 when
// Mongo is down, which apiGet() turns into null — callers show a blank, never a made-up number.
//   GET /analytics/payments/by-method[?stall_id=]  -> [{ method, total, count }]
//   GET /analytics/payments/net-by-stall           -> [{ stall_id, gross, refunded, net, payment_count, refund_count }]
// net-by-stall only has stall IDs (as strings); names come from the stall routes (MenuContext).
export function getPaymentsByMethod(stallId) {
  return apiGet(stallId ? `/analytics/payments/by-method?stall_id=${encodeURIComponent(stallId)}` : '/analytics/payments/by-method')
}

export function getNetByStall() {
  return apiGet('/analytics/payments/net-by-stall')
}

// status: 'loading' | 'ready' | 'unavailable'. A failed refresh after a good load keeps the last data.
export function usePaymentAnalytics() {
  const [state, setState] = useState({ status: 'loading', byMethod: [], netByStall: [] })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [byMethod, netByStall] = await Promise.all([getPaymentsByMethod(), getNetByStall()])
      if (cancelled) return
      if (Array.isArray(byMethod) && Array.isArray(netByStall)) {
        setState({ status: 'ready', byMethod, netByStall })
      } else {
        setState((prev) => (prev.status === 'ready' ? prev : { status: 'unavailable', byMethod: [], netByStall: [] }))
      }
    }

    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return state
}
