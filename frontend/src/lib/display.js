// How API values are shown. The backend sends `null` when there is no real data (no paid
// orders -> no average ticket, no SFA grade loaded yet, Mongo down -> no star rating) and `0`
// when the real answer is zero. Show a blank dash for null and a real 0 for 0 — never turn one
// into the other, and never invent a stand-in number (docs/api-contract.md).

export const BLANK = '—'

const isBlank = (value) => value === null || value === undefined || value === ''

export function money(value) {
  return isBlank(value) ? BLANK : `$${Number(value).toFixed(2)}`
}

export function count(value) {
  return isBlank(value) ? BLANK : String(Number(value))
}

export function text(value) {
  return isBlank(value) ? BLANK : String(value)
}

export function percent(value) {
  return isBlank(value) ? BLANK : `${Number(value).toFixed(1)}%`
}

// peak_hour is 0-23 (hour of day the stall gets the most paid orders)
export function hour(value) {
  return isBlank(value) ? BLANK : `${String(Number(value)).padStart(2, '0')}:00`
}
