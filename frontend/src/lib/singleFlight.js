import { useCallback, useRef } from 'react'

// POST /orders/pay, /refund and friends have no idempotency key, so a double click (or two clicks
// in the same tick, before React has re-rendered a disabled button) would send two requests and
// move money twice. This ignores a second call while the first is still running.
// Use: const once = useSingleFlight();  const submit = () => once(async () => { ... })
export function useSingleFlight() {
  const running = useRef(false)
  return useCallback(async (task) => {
    if (running.current) return undefined
    running.current = true
    try {
      return await task()
    } finally {
      running.current = false
    }
  }, [])
}
