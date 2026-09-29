import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCentres, getMenu, getStalls } from '../lib/browseApi.js'

const MenuContext = createContext(null)

// Single-stall MVP: shows the first centre's first stall, same scope the old
// hardcoded dishes.js covered. Chains GET /centres -> GET /centres/:id/stalls
// -> GET /stalls/:id/menu once on load. `status` drives what the UI shows —
// never fall back to fake dishes, per the "no hardcoded fake stalls" rule.
const INITIAL_STATE = { status: 'loading', centre: null, stall: null, dishes: [] }

export function MenuProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false
    const set = (next) => {
      if (!cancelled) setState(next)
    }

    async function load() {
      const centres = await getCentres()
      if (!centres) return set({ ...INITIAL_STATE, status: 'unavailable' })
      if (centres.length === 0) return set({ ...INITIAL_STATE, status: 'empty' })
      const centre = centres[0]

      const stalls = await getStalls(centre.centre_id)
      if (!stalls) return set({ ...INITIAL_STATE, status: 'unavailable', centre })
      if (stalls.length === 0) return set({ ...INITIAL_STATE, status: 'empty', centre })
      const stall = stalls[0]

      const dishes = await getMenu(stall.stall_id)
      if (!dishes) return set({ ...INITIAL_STATE, status: 'unavailable', centre, stall })
      set({ status: dishes.length ? 'ready' : 'empty', centre, stall, dishes })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => state, [state])

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
