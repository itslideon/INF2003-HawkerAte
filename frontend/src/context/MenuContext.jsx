import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getCentres, getMenu, getStalls } from '../lib/browseApi.js'

const MenuContext = createContext(null)

// Shows the first centre. Chains GET /centres -> GET /centres/:id/stalls -> GET /stalls/:id/menu
// once on load (first stall opens by default); selectStall() then loads any other stall in the
// centre. `status` drives what the UI shows — never fall back to fake dishes, per the "no
// hardcoded fake stalls" rule. `switching` is true while a newly picked stall's menu loads, and
// `switchError` is set if that menu could not be loaded (the previous stall stays on screen).
const INITIAL_STATE = {
  status: 'loading',
  centre: null,
  stalls: [],
  stall: null,
  dishes: [],
  switching: false,
  switchError: false,
}

export function MenuProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE)
  const requestId = useRef(0) // ignore a menu response if the diner has since picked another stall

  useEffect(() => {
    let cancelled = false
    const set = (next) => {
      if (!cancelled) setState({ ...INITIAL_STATE, ...next })
    }

    async function load() {
      const centres = await getCentres()
      if (!centres) return set({ status: 'unavailable' })
      if (centres.length === 0) return set({ status: 'empty' })
      const centre = centres[0]

      const stalls = await getStalls(centre.centre_id)
      if (!stalls) return set({ status: 'unavailable', centre })
      if (stalls.length === 0) return set({ status: 'empty', centre })
      const stall = stalls[0]

      const dishes = await getMenu(stall.stall_id)
      if (!dishes) return set({ status: 'unavailable', centre, stalls, stall })
      set({ status: dishes.length ? 'ready' : 'empty', centre, stalls, stall, dishes })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const latest = useRef(state)
  latest.current = state

  const selectStall = useCallback(async (stallId) => {
    const target = latest.current.stalls.find((s) => s.stall_id === stallId)
    if (!target || target.stall_id === latest.current.stall?.stall_id) return
    const myRequest = ++requestId.current
    setState((prev) => ({ ...prev, switching: true, switchError: false }))
    const dishes = await getMenu(stallId)
    if (myRequest !== requestId.current) return
    setState((prev) =>
      dishes
        ? { ...prev, status: dishes.length ? 'ready' : 'empty', stall: target, dishes, switching: false }
        : { ...prev, switching: false, switchError: true },
    )
  }, [])

  const value = useMemo(() => ({ ...state, selectStall }), [state, selectStall])

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
