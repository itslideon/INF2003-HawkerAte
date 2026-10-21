import { useCallback, useEffect, useState } from 'react'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import { useMenu } from '../context/MenuContext.jsx'
import { getStallQueue, markOrderReady } from '../lib/queueApi.js'

const POLL_MS = 3000

// Cook view for one stall: lists GET /stalls/:id/queue and lets the cook call
// POST /orders/:id/ready, which takes the order off the line. Diners poll their own
// ticket (GET /orders/:id/queue), so their screen moves when the cook presses Ready.
// Single-stall MVP, same as the diner side: uses the first stall from MenuContext.
// No staff login exists yet, so this page is open to anyone who knows /stall.
export default function StallQueuePage() {
  const { status, stall } = useMenu()
  const stallId = stall?.stall_id

  const [queue, setQueue] = useState(undefined) // undefined = loading, null = API unreachable
  const [busyOrderId, setBusyOrderId] = useState(null)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (stallId == null) return
    setQueue(await getStallQueue(stallId))
  }, [stallId])

  useEffect(() => {
    if (stallId == null) return undefined
    let cancelled = false
    const tick = async () => {
      const data = await getStallQueue(stallId)
      // keep the last good line on a failed poll so the list doesn't flicker away
      if (!cancelled) setQueue((prev) => (data === null && prev ? prev : data))
    }
    tick()
    const timer = setInterval(tick, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [stallId])

  const markReady = async (orderId) => {
    setBusyOrderId(orderId)
    setError(null)
    const result = await markOrderReady(orderId)
    setBusyOrderId(null)
    if (!result.ok) setError(result.error)
    await refresh()
  }

  const line = queue?.line ?? []

  let body
  if (status === 'loading' || (stallId != null && queue === undefined)) {
    body = <Message title="Loading the line…" text="Fetching this stall's queue." />
  } else if (status !== 'ready' && !stall) {
    body = (
      <Message
        title="No stall to show"
        text="Can't load a stall — make sure backend/app.py is running and the stall data is loaded."
      />
    )
  } else if (queue === null) {
    body = (
      <Message
        title="Queue unavailable right now"
        text="Can't reach the queue API — is backend/app.py running and 04_queue.sql applied?"
      />
    )
  } else if (line.length === 0) {
    body = <Message title="Nobody in line" text="New orders show up here as soon as a diner pays." />
  } else {
    body = (
      <div className="flex w-full flex-col gap-3">
        {line.map((entry, index) => {
          const isNext = index === 0
          return (
            <div
              key={entry.order_id}
              className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl p-4 sm:p-5 ${
                isNext ? 'bg-lime' : 'bg-surface'
              }`}
            >
              <div className="flex items-center gap-4">
                <p className="min-w-[64px] text-3xl font-extrabold text-ink">#{entry.ticket_no}</p>
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-ink">{isNext ? 'Now serving' : 'Waiting'}</p>
                  <p className="text-xs text-muted">
                    Order {entry.order_id}
                    {entry.customer_id != null ? ` · customer ${entry.customer_id}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => markReady(entry.order_id)}
                disabled={busyOrderId === entry.order_id}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busyOrderId === entry.order_id ? 'Updating…' : 'Ready / collected'}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 py-8 sm:px-8 lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-2">
          <p className="text-xs font-bold uppercase text-coral">Stall view</p>
          <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">
            {stall ? `${stall.name} — queue` : 'Stall queue'}
          </h1>
          <p className="text-base leading-[1.5] text-muted">
            Press Ready / collected when an order is handed over. It leaves the line and the next ticket moves up on the
            diner's screen.
          </p>
        </Reveal>

        {queue && (
          <div className="flex w-full flex-wrap gap-3">
            <div className="rounded-2xl bg-forest px-5 py-3 text-white">
              <p className="text-[11px] font-bold uppercase text-white/73">Now serving</p>
              <p className="text-2xl font-extrabold">
                {queue.now_serving_ticket != null ? `#${queue.now_serving_ticket}` : '—'}
              </p>
            </div>
            <div className="rounded-2xl bg-surface px-5 py-3">
              <p className="text-[11px] font-bold uppercase text-muted">Waiting</p>
              <p className="text-2xl font-extrabold text-ink">{queue.waiting ?? line.length}</p>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="w-full rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral">
            {error}
          </p>
        )}

        {body}
      </div>
    </div>
  )
}

function Message({ title, text }) {
  return (
    <div className="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6">
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-xs text-muted">{text}</p>
    </div>
  )
}
