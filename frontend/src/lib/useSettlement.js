import { useEffect, useState } from 'react'
import { apiGet } from './api.js'

const POLL_MS = 30000

// GET /settlement (docs/api-contract.md): paid sales per stall for one day, read from
// the v_daily_settlement view. No date = today. Empty `stalls` means no paid orders
// that day, show zeros / an empty state, never a placeholder number.
export function getSettlement(date) {
  return apiGet(date ? `/settlement?date=${encodeURIComponent(date)}` : '/settlement')
}

export function summarise(stalls) {
  const sum = (key) => stalls.reduce((total, stall) => total + Number(stall[key] ?? 0), 0)
  const orders = sum('order_count')
  const sales = sum('sales_total')
  const cash = sum('cash_sales')
  const paynow = sum('paynow_sales')
  const card = sum('card_sales')
  return {
    orders,
    sales,
    cash,
    paynow,
    card,
    cashless: paynow + card,
    avgTicket: orders > 0 ? sales / orders : 0,
    stallCount: stalls.length,
  }
}

// status: 'loading' | 'ready' | 'unavailable'. A failed refresh after a good load keeps
// the last numbers on screen instead of flipping the whole section to an error.
export function useSettlement(date = '') {
  const [state, setState] = useState({ status: 'loading', stalls: [] })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', stalls: [] })

    const load = async () => {
      const data = await getSettlement(date)
      if (cancelled) return
      if (data && Array.isArray(data.stalls)) {
        setState({ status: 'ready', stalls: data.stalls })
      } else {
        setState((prev) => (prev.status === 'ready' ? prev : { status: 'unavailable', stalls: [] }))
      }
    }

    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [date])

  return { ...state, summary: summarise(state.stalls) }
}
