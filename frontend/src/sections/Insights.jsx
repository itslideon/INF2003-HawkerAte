import { useState } from 'react'
import Reveal from '../components/Reveal.jsx'
import StallRating from '../components/StallRating.jsx'
import { useMenu } from '../context/MenuContext.jsx'
import { usePaymentAnalytics } from '../lib/analyticsApi.js'
import { useSettlement } from '../lib/useSettlement.js'

const money = (value) => `$${Number(value).toFixed(2)}`
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// local YYYY-MM-DD, so the day picker can show "today" instead of an empty dd/mm/yyyy
function localToday() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Everything here is computed from GET /settlement (paid sales per stall for one day,
// MariaDB view v_daily_settlement). Nothing is invented: a quiet day shows zeros and an
// empty state. Visits, wait time, trending dish and "busier now" have no data source, so
// they are not shown.
export default function Insights() {
  const [date, setDate] = useState('') // '' = today (omit ?date= so the server uses CURDATE())
  const today = localToday()
  const { status, stalls, summary } = useSettlement(date)
  const ready = status === 'ready'
  const empty = ready && stalls.length === 0
  const topStalls = stalls.slice(0, 5) // API already sorts by sales_total, highest first
  const topSales = topStalls[0] ? Number(topStalls[0].sales_total) : 0

  const metrics = [
    { label: 'Sales', value: ready ? money(summary.sales) : '—', note: ready ? `${summary.orders} paid orders` : '' },
    {
      label: 'Average ticket',
      value: ready ? money(summary.avgTicket) : '—',
      note: ready ? `across ${summary.stallCount} stall${summary.stallCount === 1 ? '' : 's'}` : '',
    },
    {
      label: 'Cashless share',
      value: ready ? `${percent(summary.cashless, summary.sales)}%` : '—',
      note: ready ? `${money(summary.cashless)} cashless · ${money(summary.cash)} cash` : '',
    },
    {
      label: 'Top stall',
      value: ready && topStalls[0] ? topStalls[0].stall_name : '—',
      note: ready && topStalls[0] ? money(topStalls[0].sales_total) : '',
    },
  ]

  // Payment mix + net by stall come from Mongo (Wileen's analytics routes), all days together.
  // When Mongo is down they are blank, not estimated. The day-picker cards above stay on SQL.
  const analytics = usePaymentAnalytics()
  const analyticsReady = analytics.status === 'ready'
  const { stalls: knownStalls } = useMenu()
  const stallName = (stallId) => knownStalls.find((s) => String(s.stall_id) === String(stallId))?.name ?? `Stall #${stallId}`
  const methodTotal = (method) => Number(analytics.byMethod.find((row) => row.method === method)?.total ?? 0)
  const mixTotal = methodTotal('cash') + methodTotal('paynow') + methodTotal('card')
  const mix = [
    { label: 'Cash', amount: methodTotal('cash'), bar: 'bg-amber' },
    { label: 'PayNow', amount: methodTotal('paynow'), bar: 'bg-coral' },
    { label: 'Card', amount: methodTotal('card'), bar: 'bg-lime' },
  ]
  const mixText =
    analytics.status === 'loading'
      ? 'Loading…'
      : 'Payment breakdown unavailable. The reviews/payments database (Mongo) is not reachable right now.'

  const emptyText =
    status === 'unavailable'
      ? "Can't reach the API. Make sure backend/app.py is running and sql/views/v_daily_settlement.sql is applied."
      : status === 'loading'
        ? 'Loading…'
        : 'No paid orders on this day yet.'

  return (
    <section id="insights" className="flex w-full flex-col items-start bg-cream">
      <div className="flex w-full flex-col items-start gap-5 px-4 pb-9 pt-7 sm:px-8 lg:px-12">
        <Reveal className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-1">
            <p className="text-xs font-bold text-coral">SALES INSIGHTS</p>
            <h2 className="text-[26px] font-extrabold text-ink sm:text-[34px]">What's selling</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-semibold text-ink">
              <span className="text-muted">Day</span>
              <input
                type="date"
                value={date || today}
                max={today}
                onChange={(event) => setDate(event.target.value === today ? '' : event.target.value)}
                className="bg-transparent text-[13px] font-semibold text-ink outline-none"
                aria-label="Choose a day"
              />
            </label>
            {date && (
              <button
                type="button"
                onClick={() => setDate('')}
                className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity duration-200 hover:opacity-60"
              >
                Today
              </button>
            )}
          </div>
        </Reveal>

        <div className="grid w-full grid-cols-2 gap-3.5 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Reveal
              key={metric.label}
              delay={index * 100}
              className="flex flex-col items-start gap-1.5 rounded-2xl bg-surface p-4 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="text-[11px] font-bold text-muted">{metric.label}</p>
              <p className="text-[22px] font-extrabold text-ink">{metric.value}</p>
              <p className="text-[11px] font-semibold text-success">{metric.note}</p>
            </Reveal>
          ))}
        </div>

        <div className="flex w-full flex-col items-start gap-[18px] lg:flex-row">
          <Reveal
            delay={150}
            className="flex w-full flex-col items-start gap-4 rounded-3xl bg-forest-dark p-[22px] lg:flex-1"
          >
            <p className="text-xl font-extrabold text-white">Payment mix</p>
            {!analyticsReady ? (
              <p className="text-sm text-white/70">{mixText}</p>
            ) : mixTotal === 0 ? (
              <p className="text-sm text-white/70">No payments recorded yet.</p>
            ) : (
              <>
                {mix.map((row) => (
                  <div key={row.label} className="flex w-full flex-col items-start gap-2">
                    <div className="flex w-full items-start justify-between text-sm text-white">
                      <p className="font-bold">{row.label}</p>
                      <p>
                        {money(row.amount)} · {percent(row.amount, mixTotal)}%
                      </p>
                    </div>
                    <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/15">
                      <div
                        className={`h-[8px] rounded-full transition-all duration-1000 ease-out ${row.bar}`}
                        style={{ width: `${percent(row.amount, mixTotal)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-white/60">All days, before refunds.</p>
              </>
            )}
          </Reveal>

          <Reveal
            delay={250}
            className="flex w-full flex-col items-start gap-[18px] rounded-3xl bg-surface p-[22px] lg:w-[360px] lg:shrink-0"
          >
            <p className="text-xl font-extrabold text-ink">Top stalls</p>
            {!ready || empty ? (
              <p className="text-sm text-muted">{emptyText}</p>
            ) : (
              topStalls.map((stall, index) => (
                <div key={stall.stall_id} className="flex w-full flex-col items-start gap-2">
                  <div className="flex w-full items-start gap-2.5">
                    <p className="w-5 text-[13px] font-extrabold text-coral">{String(index + 1).padStart(2, '0')}</p>
                    <div className="flex flex-1 flex-col items-start gap-0.5">
                      <p className="text-sm font-bold text-ink">
                        {stall.stall_name}
                        <StallRating stallId={stall.stall_id} className="ml-2 text-[11px] font-semibold text-muted" />
                      </p>
                      <p className="text-[11px] text-muted">
                        {stall.order_count} order{Number(stall.order_count) === 1 ? '' : 's'}
                        {stall.cuisine_type ? ` · ${stall.cuisine_type}` : ''}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-success">{money(stall.sales_total)}</p>
                  </div>
                  <div className="h-[5px] w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-[5px] rounded-full bg-coral transition-all duration-1000 ease-out"
                      style={{ width: `${percent(Number(stall.sales_total), topSales)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </Reveal>
        </div>

        <Reveal delay={300} className="flex w-full flex-col items-start gap-3 rounded-3xl bg-surface p-[22px]">
          <div className="flex flex-col items-start gap-1">
            <p className="text-xl font-extrabold text-ink">Gross, refunds and net by stall</p>
            <p className="text-[11px] text-muted">All days, from the payments log. Blank if that log is unreachable.</p>
          </div>
          {!analyticsReady ? (
            <p className="text-sm text-muted">{mixText}</p>
          ) : analytics.netByStall.length === 0 ? (
            <p className="text-sm text-muted">No payments recorded yet.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase text-muted">
                    <th className="py-2 pr-3">Stall</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                    <th className="px-3 py-2 text-right">Refunded</th>
                    <th className="py-2 pl-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.netByStall.map((row) => (
                    <tr key={row.stall_id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-bold text-ink">{stallName(row.stall_id)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{money(row.gross)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">
                        {money(row.refunded)}
                        <span className="ml-1 text-[11px] text-muted">({row.refund_count})</span>
                      </td>
                      <td className="py-2.5 pl-3 text-right font-bold text-ink">{money(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}
