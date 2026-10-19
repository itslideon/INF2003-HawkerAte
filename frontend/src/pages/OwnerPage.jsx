import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import Button from '../components/Button.jsx'
import { useMenu } from '../context/MenuContext.jsx'
import { getStallTakings } from '../lib/ownerApi.js'

function sgd(value) {
  if (value == null) return '—'
  return `$${Number(value).toFixed(2)}`
}

export default function OwnerPage() {
  const navigate = useNavigate()
  const { stall } = useMenu()
  const stallId = stall?.stall_id
  const [takings, setTakings] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(async () => {
    if (!stallId) return
    setStatus('loading')
    const row = await getStallTakings(stallId)
    if (!row) {
      setTakings(null)
      setStatus('unavailable')
      return
    }
    setTakings(row)
    setStatus('ready')
  }, [stallId])

  useEffect(() => {
    load()
  }, [load])

  const noSales = takings && Number(takings.today_orders) === 0

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 pb-10 pt-8 sm:px-8 lg:px-16 lg:pt-9">
        <Reveal className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex w-full max-w-[640px] flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Stall owner</p>
            <h1 className="text-[32px] font-extrabold leading-[1.05] text-ink sm:text-[46px]">
              Today's takings
            </h1>
            <p className="text-base leading-[1.5] text-muted">
              Totals come from MariaDB (v_owner_takings), not a placeholder on this page.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="light" onClick={load}>
              Refresh
            </Button>
            <Button variant="dark" onClick={() => navigate('/', { state: { scrollTo: 'order' } })}>
              Place a test order
            </Button>
          </div>
        </Reveal>

        {status === 'loading' && (
          <p className="text-sm text-muted">Loading today’s SQL totals…</p>
        )}

        {status === 'unavailable' && (
          <Reveal className="w-full rounded-3xl bg-surface p-6">
            <p className="text-sm text-muted">
              Can’t reach the API. Is Flask running on port 3000, and did you apply
              sql/views/v_owner_takings.sql?
            </p>
          </Reveal>
        )}

        {status === 'ready' && takings && (
          <>
            <Reveal className="flex w-full flex-col items-start gap-2 rounded-3xl bg-forest p-6 text-white">
              <p className="text-xs font-bold uppercase text-lime">
                Stall {takings.stall_id}
              </p>
              <p className="text-2xl font-extrabold">{takings.stall_name}</p>
              <p className="text-sm text-white/73">
                {takings.centre_name}
                {takings.cuisine_type ? ` · ${takings.cuisine_type}` : ''}
              </p>
            </Reveal>

            {noSales ? (
              <Reveal delay={100} className="w-full rounded-3xl bg-surface p-6">
                <p className="text-xl font-extrabold text-ink">No paid orders today</p>
                <p className="mt-2 text-sm text-muted">
                  Sales are $0.00 until someone pays this stall. That empty state is
                  real — this page will not invent a total.
                </p>
              </Reveal>
            ) : null}

            <div className="grid w-full grid-cols-2 gap-3.5 lg:grid-cols-3">
              {[
                { label: "Today's sales", value: sgd(takings.today_sales) },
                { label: 'Orders', value: String(takings.today_orders ?? 0) },
                {
                  label: 'Avg ticket',
                  value: noSales ? '—' : sgd(takings.today_avg_ticket),
                },
              ].map((card) => (
                <Reveal
                  key={card.label}
                  className="flex flex-col items-start gap-1.5 rounded-2xl bg-surface p-4"
                >
                  <p className="text-[11px] font-bold text-muted">{card.label}</p>
                  <p className="text-[22px] font-extrabold text-ink">{card.value}</p>
                </Reveal>
              ))}
            </div>

            <div className="grid w-full grid-cols-2 gap-3.5">
              {[
                { label: 'Cash today', value: sgd(takings.cash_today) },
                { label: 'Cashless today', value: sgd(takings.cashless_today) },
              ].map((card) => (
                <Reveal
                  key={card.label}
                  className="flex flex-col items-start gap-1.5 rounded-2xl bg-surface p-4"
                >
                  <p className="text-[11px] font-bold text-muted">{card.label}</p>
                  <p className="text-[22px] font-extrabold text-ink">{card.value}</p>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
