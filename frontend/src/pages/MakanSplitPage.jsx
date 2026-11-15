import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import Button from '../components/Button.jsx'
import { useOrderTracker } from '../context/OrderTrackerContext.jsx'
import { DEMO_CUSTOMER_ID } from '../lib/orderApi.js'
import { createSession, getOrderSession, settleShare } from '../lib/splitApi.js'

const MAX_FRIENDS = 3 // demo scope: organizer + up to 3 friends
const money = (value) => `$${Number(value).toFixed(2)}`

// Makan split: one bill to the stall, settle among friends. The stall is already paid by
// POST /orders/pay; this screen records who owes the organizer (POST /dining-sessions) and
// lets each friend settle (POST /dining-sessions/:id/settle, wallet -> organizer). Shares
// shown after creation are the server's numbers, never ours. There is no login, so one screen
// acts for everyone: "Settle" stands in for the friend paying from their own wallet.
export default function MakanSplitPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { getOrder } = useOrderTracker()
  const order = getOrder(orderId)

  const [session, setSession] = useState(undefined) // undefined = loading, null = no split yet
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(async () => {
    const result = await getOrderSession(orderId)
    if (result.ok) {
      setSession(result.data)
      setLoadError(null)
    } else if (result.status === 404) {
      setSession(null)
      setLoadError(null)
    } else {
      setLoadError(result.error)
    }
  }, [orderId])

  useEffect(() => {
    setSession(undefined)
    load()
  }, [load])

  let body
  if (loadError) {
    body = (
      <Notice
        title="Makan split unavailable"
        text={`${loadError} (Needs backend/app.py running and sql/schema/03_split.sql applied.)`}
      />
    )
  } else if (session === undefined) {
    body = <Notice title="Loading…" text="Checking whether this order is already split." />
  } else if (session) {
    body = <SessionView session={session} order={order} onChange={setSession} />
  } else if (!order) {
    body = (
      <Notice
        title="We couldn't find that order"
        text="Open the split from your order page so we know the total. Guest orders are only kept until the tab closes."
      />
    )
  } else {
    body = <CreateForm order={order} onCreated={setSession} />
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 py-8 sm:px-8 lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-2">
          <p className="text-xs font-bold uppercase text-coral">Order {orderId}</p>
          <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">
            Makan split
          </h1>
          <p className="max-w-[620px] text-base leading-[1.5] text-muted">
            One bill to the stall, settle among friends. The stall is already paid. Friends repay the organizer, not the
            stall.
          </p>
        </Reveal>
        {body}
        <Button variant="light" onClick={() => navigate(`/orders/${orderId}`)}>
          Back to order
        </Button>
      </div>
    </div>
  )
}

function Notice({ title, text }) {
  return (
    <div className="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6">
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-xs text-muted">{text}</p>
    </div>
  )
}

function ErrorLine({ children }) {
  return (
    <p role="alert" className="w-full rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral">
      {children}
    </p>
  )
}

const inputClass =
  'w-full rounded-xl border border-border bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-forest'

function CreateForm({ order, onCreated }) {
  const total = Number(order.total_amount)
  const organizerId = DEMO_CUSTOMER_ID
  const [mode, setMode] = useState('equal')
  const [friends, setFriends] = useState(['', '']) // customer ids typed as text
  const [amounts, setAmounts] = useState({ organizer: '', 0: '', 1: '', 2: '' }) // custom mode
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const friendIds = friends.map((value) => Number(value))
  const filled = friends.map((value, index) => ({ index, id: friendIds[index], text: value })).filter((f) => f.text !== '')
  const idsValid = filled.every((f) => Number.isInteger(f.id) && f.id > 0 && f.id !== organizerId)
  const idsUnique = new Set(filled.map((f) => f.id)).size === filled.length
  const peopleCount = filled.length + 1

  const customRows = [
    { key: 'organizer', id: organizerId },
    ...filled.map((f) => ({ key: f.index, id: f.id })),
  ]
  const allocated = customRows.reduce((sum, row) => sum + Number(amounts[row.key] || 0), 0)
  const customOk =
    customRows.every((row) => Number(amounts[row.key]) > 0) && Math.abs(allocated - total) < 0.005

  const canSubmit =
    !submitting && filled.length >= 1 && idsValid && idsUnique && (mode === 'equal' || (mode === 'custom' && customOk))

  const setFriend = (index, value) => setFriends((prev) => prev.map((v, i) => (i === index ? value : v)))

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const payload =
      mode === 'equal'
        ? { order_id: order.order_id, split_type: 'equal', customer_ids: [organizerId, ...filled.map((f) => f.id)] }
        : {
            order_id: order.order_id,
            split_type: 'custom',
            members: customRows.map((row) => ({ customer_id: row.id, share_amount: Number(amounts[row.key]) })),
          }
    const result = await createSession(payload)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onCreated(result.data)
  }

  return (
    <Reveal className="flex w-full flex-col items-start gap-5 rounded-3xl bg-surface p-5 sm:p-8">
      <div className="flex w-full items-start justify-between">
        <p className="text-xl font-extrabold text-ink">Split this bill</p>
        <p className="text-xl font-extrabold text-ink">{money(total)}</p>
      </div>

      <fieldset className="flex w-full flex-col gap-2">
        <legend className="mb-2 text-sm font-bold text-ink">How to split</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'equal', label: 'Equal' },
            { value: 'custom', label: 'Custom amounts' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:opacity-60 ${
                mode === option.value ? 'bg-ink text-white' : 'bg-cream text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            disabled
            title="Needs the API to return each order line's id, which it doesn't yet"
            className="cursor-not-allowed rounded-full bg-cream px-4 py-2 text-xs font-semibold text-muted opacity-60"
          >
            By item (coming soon)
          </button>
        </div>
      </fieldset>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center gap-3">
          <div className="flex-1 rounded-xl bg-lime/40 px-3 py-2.5 text-sm font-bold text-ink">
            You (organizer) · customer {organizerId}
          </div>
          {mode === 'custom' && (
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="$ share"
              value={amounts.organizer}
              onChange={(event) => setAmounts((prev) => ({ ...prev, organizer: event.target.value }))}
              aria-label="Your share"
              className={`${inputClass} !w-28`}
            />
          )}
        </div>

        {friends.map((value, index) => (
          <div key={index} className="flex w-full items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder={`Friend ${index + 1} customer ID`}
              value={value}
              onChange={(event) => setFriend(index, event.target.value)}
              aria-label={`Friend ${index + 1} customer ID`}
              className={`${inputClass} flex-1`}
            />
            {mode === 'custom' && (
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="$ share"
                value={amounts[index]}
                onChange={(event) => setAmounts((prev) => ({ ...prev, [index]: event.target.value }))}
                aria-label={`Friend ${index + 1} share`}
                className={`${inputClass} !w-28`}
              />
            )}
          </div>
        ))}

        {friends.length < MAX_FRIENDS && (
          <button
            type="button"
            onClick={() => setFriends((prev) => [...prev, ''])}
            className="w-fit text-sm font-semibold text-forest transition-opacity duration-200 hover:opacity-60"
          >
            + Add a friend
          </button>
        )}
        <p className="text-xs text-muted">
          Friends need an existing customer ID with a wallet. There's no friend search yet.
        </p>
      </div>

      {mode === 'equal' && filled.length >= 1 && idsValid && idsUnique && (
        <p className="text-sm text-ink">
          About <span className="font-extrabold">{money(total / peopleCount)}</span> each across {peopleCount} people.
          Exact cents are worked out by the server.
        </p>
      )}
      {mode === 'custom' && (
        <p className={`text-sm font-semibold ${customOk ? 'text-success' : 'text-ink'}`}>
          Allocated {money(allocated)} of {money(total)}
          {customOk ? ' ✓' : `, ${money(Math.abs(total - allocated))} ${allocated < total ? 'left to assign' : 'over'}`}
        </p>
      )}
      {filled.length >= 1 && !idsValid && (
        <ErrorLine>Use whole-number customer IDs that aren't your own.</ErrorLine>
      )}
      {filled.length >= 1 && idsValid && !idsUnique && <ErrorLine>Each friend can only be added once.</ErrorLine>}
      {error && <ErrorLine>{error}</ErrorLine>}

      <Button variant="dark" onClick={submit} disabled={!canSubmit} className="w-full justify-center">
        {submitting ? 'Creating split…' : 'Create Makan split'}
      </Button>
    </Reveal>
  )
}

function SessionView({ session, order, onChange }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const settle = async (customerId) => {
    setBusyId(customerId)
    setError(null)
    const result = await settleShare(session.session_id, customerId)
    setBusyId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onChange(result.data)
  }

  const stallLabel = order?.stall_name ?? 'The stall'

  return (
    <Reveal className="flex w-full flex-col items-start gap-5 rounded-3xl bg-surface p-5 sm:p-8">
      <div className="flex w-full flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-xl font-extrabold text-ink">{session.product ?? 'Makan split'}</p>
          <p className="text-xs text-muted">
            {session.split_type} split · session {session.session_id}
          </p>
        </div>
        <p className="text-xl font-extrabold text-ink">{money(session.total_amount)}</p>
      </div>

      {session.stall_paid && (
        <p className="w-full rounded-xl bg-lime/40 p-3 text-sm font-semibold text-ink">
          ✓ {stallLabel} is already paid in full by customer {session.organizer_customer_id}.
        </p>
      )}

      <div className="flex w-full flex-col gap-2.5">
        {session.members.map((member) => (
          <div
            key={member.session_member_id}
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4"
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-ink">
                Customer {member.customer_id}
                {member.is_organizer ? ' · organizer' : ''}
              </p>
              <p className="text-xs text-muted">
                {member.is_organizer
                  ? 'Paid the stall'
                  : member.is_settled
                    ? 'Settled, paid the organizer'
                    : 'Owes the organizer'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-base font-extrabold text-ink">{money(member.share_amount)}</p>
              {member.is_settled ? (
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">Settled</span>
              ) : (
                <button
                  type="button"
                  onClick={() => settle(member.customer_id)}
                  disabled={busyId === member.customer_id}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition-opacity duration-200 hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busyId === member.customer_id ? 'Settling…' : `Settle ${money(member.share_amount)}`}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}

      {session.all_settled ? (
        <p className="w-full rounded-xl bg-lime p-3 text-sm font-extrabold text-ink">Everyone's settled up 🎉</p>
      ) : (
        <p className="text-xs text-muted">
          Demo: "Settle" stands in for that friend paying from their own wallet to the organizer's wallet.
        </p>
      )}
    </Reveal>
  )
}
