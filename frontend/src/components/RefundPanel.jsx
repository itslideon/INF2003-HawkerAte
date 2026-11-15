import { useCallback, useEffect, useState } from 'react'
import { getStallQueue } from '../lib/queueApi.js'
import { refundOrder } from '../lib/refundApi.js'

const POLL_MS = 5000

// Owner refund: POST /orders/:id/refund. The API has no "list this stall's orders" route yet, so
// orders come from two places: the stall's live queue (orders not yet handed over) and a box to
// enter any order ID. Refunding is a money move, so every refund asks for a second click first.
// The refunded amount shown afterwards is the server's number.
export default function RefundPanel({ stallId, onRefunded }) {
  const [queue, setQueue] = useState(undefined) // undefined = loading, null = API unreachable
  const [target, setTarget] = useState(null) // order id waiting for confirmation
  const [manualId, setManualId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const loadQueue = useCallback(async () => {
    if (stallId == null) return
    const data = await getStallQueue(stallId)
    setQueue((prev) => (data === null && prev ? prev : data)) // keep the last good list on a failed poll
  }, [stallId])

  useEffect(() => {
    if (stallId == null) return undefined
    loadQueue()
    const timer = setInterval(loadQueue, POLL_MS)
    return () => clearInterval(timer)
  }, [stallId, loadQueue])

  const confirmRefund = async () => {
    setBusy(true)
    setError(null)
    setDone(null)
    const result = await refundOrder(target)
    setBusy(false)
    setTarget(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDone(result.data)
    setManualId('')
    await loadQueue()
    onRefunded?.()
  }

  const startManual = () => {
    const id = Number(manualId)
    if (!Number.isInteger(id) || id < 1) {
      setError('Enter a whole-number order ID.')
      return
    }
    setError(null)
    setDone(null)
    setTarget(id)
  }

  const line = queue?.line ?? []

  return (
    <section className="flex w-full flex-col items-start gap-4 rounded-3xl bg-surface p-6">
      <div className="flex flex-col gap-1">
        <p className="text-xl font-extrabold text-ink">Refund an order</p>
        <p className="max-w-[640px] text-sm leading-[1.5] text-muted">
          Returns the money to the customer's wallet through a reversing ledger entry (nothing is deleted) and takes the
          order off the stall line. Only paid orders can be refunded.
        </p>
      </div>

      {target != null && (
        <div role="alertdialog" className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber/25 p-4">
          <p className="text-sm font-bold text-ink">
            Refund order {target}? This can't be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmRefund}
              disabled={busy}
              className="rounded-full bg-coral px-4 py-2 text-xs font-bold text-white transition-opacity duration-200 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Refunding…' : 'Yes, refund'}
            </button>
            <button
              type="button"
              onClick={() => setTarget(null)}
              disabled={busy}
              className="rounded-full bg-cream px-4 py-2 text-xs font-bold text-ink transition-opacity duration-200 hover:opacity-60 disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {done && (
        <div role="status" className="w-full rounded-xl bg-lime/50 p-3 text-sm font-semibold text-ink">
          Order {done.order_id} refunded — ${Number(done.refund_amount).toFixed(2)} returned to the customer's wallet.
          {done.mongo_written === false && (
            <span className="mt-1 block text-xs font-normal text-muted">
              Saved in MariaDB; the Mongo audit event could not be written.
            </span>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="w-full rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral">
          {error}
        </p>
      )}

      <div className="flex w-full flex-col gap-2">
        <p className="text-xs font-bold uppercase text-muted">Orders in line now</p>
        {queue === undefined ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : queue === null ? (
          <p className="text-sm text-muted">Can't reach the queue — is backend/app.py running?</p>
        ) : line.length === 0 ? (
          <p className="text-sm text-muted">No orders waiting right now.</p>
        ) : (
          line.map((entry) => (
            <div
              key={entry.order_id}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-3"
            >
              <p className="text-sm text-ink">
                <span className="font-extrabold">#{entry.ticket_no}</span> · Order {entry.order_id}
                {entry.customer_id != null ? ` · customer ${entry.customer_id}` : ''}
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setDone(null)
                  setTarget(entry.order_id)
                }}
                disabled={busy}
                className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition-opacity duration-200 hover:opacity-60 disabled:opacity-40"
              >
                Refund
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex w-full flex-col gap-2">
        <p className="text-xs font-bold uppercase text-muted">Or refund an order by ID</p>
        <div className="flex w-full max-w-[420px] gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={manualId}
            onChange={(event) => setManualId(event.target.value)}
            placeholder="Order ID"
            aria-label="Order ID to refund"
            className="w-full rounded-xl border border-border bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-forest"
          />
          <button
            type="button"
            onClick={startManual}
            disabled={busy || manualId === ''}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Refund
          </button>
        </div>
      </div>
    </section>
  )
}
