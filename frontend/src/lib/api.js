// Thin fetch wrapper for calling Lideon's API (see ../../../docs/api-contract.md).
// Every endpoint that isn't live yet, or that the API isn't reachable for, should
// resolve to `null` here rather than throw, callers show a waiting/empty state
// instead of a fake number, per the frontend README rule.

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// 4xx messages are written for the user ("insufficient wallet balance"), so they are shown as they
// are. 5xx messages are raw database or driver errors (table names, hosts), so the visitor gets a
// plain sentence and the real text only goes to the console for the developer.
function friendlyError(status, serverMessage) {
  if (status >= 500) {
    if (serverMessage) console.warn(`API error ${status}:`, serverMessage)
    return `The server had a problem (error ${status}). Please try again in a moment.`
  }
  return serverMessage ?? `Request failed (${status})`
}

export async function apiGet(path) {
  if (!BASE_URL) return null // no backend configured yet, caller shows a waiting state

  try {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    // backend not running / unreachable, same as "not available yet" for the UI
    return null
  }
}

// Writes need to tell the user *why* something failed (e.g. "insufficient wallet
// balance"), so unlike apiGet this resolves to { ok, data, error } instead of null.
export async function apiPost(path, body) {
  if (!BASE_URL) return { ok: false, error: 'API not configured (set VITE_API_BASE_URL)' }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: friendlyError(res.status, data?.error) }
    return { ok: true, data }
  } catch {
    return { ok: false, error: "Can't reach the API. Is backend/app.py running?" }
  }
}

// For callers that must tell "404 = nothing there yet" apart from "API unreachable":
// keeps the HTTP status and the server's own error message. status 0 = never got a reply.
export async function apiRequest(path, { method = 'GET', body } = {}) {
  if (!BASE_URL) return { ok: false, status: 0, error: 'API not configured (set VITE_API_BASE_URL)' }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, status: res.status, error: friendlyError(res.status, data?.error) }
    return { ok: true, status: res.status, data }
  } catch {
    return { ok: false, status: 0, error: "Can't reach the API. Is backend/app.py running?" }
  }
}
