import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getCentres, getMenu, getStalls } from '../lib/browseApi.js'

const MenuContext = createContext(null)
const CENTRE_KEY = 'hawkerate.centre'

// Browse state for the whole app: GET /centres -> GET /centres/:id/stalls -> GET /stalls/:id/menu.
// The first centre (by name) opens by default, or the one the diner last picked. selectCentre()
// and selectStall() switch to another one. `status` drives what the UI shows, never fall back to
// fake dishes, per the "no hardcoded fake stalls" rule. `switching` is true while a newly picked
// centre or stall loads, and `switchError` is set if that load failed (the previous choice stays
// on screen).
const INITIAL_STATE = {
  status: 'loading',
  centres: [],
  centre: null,
  stalls: [],
  stall: null,
  dishes: [],
  switching: false,
  switchError: false,
}

function savedCentreId() {
  try {
    return Number(localStorage.getItem(CENTRE_KEY)) || null
  } catch {
    return null
  }
}

function rememberCentre(centreId) {
  try {
    localStorage.setItem(CENTRE_KEY, String(centreId))
  } catch {
    // storage unavailable, the choice just won't survive a refresh
  }
}

// Stalls of one centre, with the first stall's menu. null = the API failed.
async function loadCentre(centre) {
  const stalls = await getStalls(centre.centre_id)
  if (!stalls) return null
  if (stalls.length === 0) return { status: 'empty', stalls, stall: null, dishes: [] }
  const stall = stalls[0]
  const dishes = await getMenu(stall.stall_id)
  if (!dishes) return null
  return { status: dishes.length ? 'ready' : 'empty', stalls, stall, dishes }
}

export function MenuProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE)
  const [region, setRegion] = useState('All') // map region filter, also narrows the centre dropdown
  const requestId = useRef(0) // ignore a response if the diner has since picked something else

  useEffect(() => {
    let cancelled = false
    const set = (next) => {
      if (!cancelled) setState({ ...INITIAL_STATE, ...next })
    }

    async function load() {
      const centres = await getCentres()
      if (!centres) return set({ status: 'unavailable' })
      if (centres.length === 0) return set({ status: 'empty' })
      const centre = centres.find((c) => c.centre_id === savedCentreId()) ?? centres[0]

      const loaded = await loadCentre(centre)
      if (!loaded) return set({ status: 'unavailable', centres, centre })
      set({ ...loaded, centres, centre })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const latest = useRef(state)
  latest.current = state

  const selectCentre = useCallback(async (centreId) => {
    const target = latest.current.centres.find((c) => c.centre_id === centreId)
    if (!target || target.centre_id === latest.current.centre?.centre_id) return
    const myRequest = ++requestId.current
    setState((prev) => ({ ...prev, switching: true, switchError: false }))
    const loaded = await loadCentre(target)
    if (myRequest !== requestId.current) return
    if (!loaded) {
      setState((prev) => ({ ...prev, switching: false, switchError: true }))
      return
    }
    rememberCentre(target.centre_id)
    setState((prev) => ({ ...prev, ...loaded, centre: target, switching: false }))
  }, [])

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

  const value = useMemo(
    () => ({ ...state, region, setRegion, selectCentre, selectStall }),
    [state, region, selectCentre, selectStall],
  )

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
