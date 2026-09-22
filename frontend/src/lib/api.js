// Thin fetch wrapper for calling Lideon's API (see ../../../docs/api-contract.md).
// Every endpoint that isn't live yet, or that the API isn't reachable for, should
// resolve to `null` here rather than throw — callers show a waiting/empty state
// instead of a fake number, per the frontend README rule.

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiGet(path) {
  if (!BASE_URL) return null // no backend configured yet — caller shows a waiting state

  try {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    // backend not running / unreachable — same as "not available yet" for the UI
    return null
  }
}
