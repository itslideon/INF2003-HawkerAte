import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import StatusNotice from '../components/StatusNotice.jsx'
import { getInvestorRank } from '../lib/dashboardApi.js'
import { BLANK, count, money, percent, text } from '../lib/display.js'

// Investor view (GET /investor/rank): centres ranked by takings. Read-only. null -> "—", 0 -> 0.
// cashless_pct is blank for a centre with no paid orders; avg_grade is blank until real SFA
// grades are loaded.
export default function InvestorPage() {
  const [state, setState] = useState({ status: 'loading' }) // loading | ready | error
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    getInvestorRank().then((result) => {
      if (cancelled) return
      setState(result.ok ? { status: 'ready', centres: result.data.centres ?? [] } : { status: 'error', error: result.error })
    })
    return () => {
      cancelled = true
    }
  }, [attempt])

  let body
  if (state.status === 'loading') {
    body = <StatusNotice title="Loading the ranking…" />
  } else if (state.status === 'error') {
    body = (
      <StatusNotice
        title="Ranking unavailable"
        text={`${state.error} (Needs backend/app.py running and sql/views/v_investor_rank.sql applied.)`}
      />
    )
  } else if (state.centres.length === 0) {
    body = <StatusNotice title="No centres loaded yet" />
  } else {
    const top = Math.max(...state.centres.map((c) => Number(c.total_takings) || 0))
    body = (
      <div className="flex w-full flex-col gap-4">
        <div className="w-full overflow-x-auto rounded-2xl bg-surface">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-3 py-3">Centre</th>
                <th className="px-3 py-3 text-right">Stalls</th>
                <th className="px-3 py-3">Takings</th>
                <th className="px-3 py-3 text-right">Cashless</th>
                <th className="px-4 py-3 text-right">Avg grade</th>
              </tr>
            </thead>
            <tbody>
              {state.centres.map((centre, index) => {
                const takings = Number(centre.total_takings) || 0
                return (
                  <tr key={centre.centre_id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-extrabold text-coral">{String(index + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-3 font-bold text-ink">{centre.centre_name}</td>
                    <td className="px-3 py-3 text-right text-ink">{count(centre.stall_count)}</td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-ink">{money(centre.total_takings)}</p>
                      <div className="mt-1 h-[5px] w-full min-w-[120px] overflow-hidden rounded-full bg-border">
                        <div
                          className="h-[5px] rounded-full bg-coral"
                          style={{ width: top > 0 ? `${Math.round((takings / top) * 100)}%` : '0%' }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-ink">{percent(centre.cashless_pct)}</td>
                    <td
                      className="px-4 py-3 text-right text-ink"
                      title={centre.avg_grade ? undefined : 'No SFA grades loaded yet'}
                    >
                      <span className="font-bold">{text(centre.avg_grade)}</span>
                      {centre.avg_grade_score != null && (
                        <span className="ml-1 text-xs text-muted">({Number(centre.avg_grade_score).toFixed(2)})</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="max-w-[640px] text-xs leading-[1.5] text-muted">
          {BLANK} means there is no data for that yet (no paid orders, or no SFA grades loaded). 0 is a real zero. Grades
          score A=4 … D=1 and ignore stalls without a grade. Ranked by total takings; this page never writes anything.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 py-8 sm:px-8 lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-2">
          <p className="text-xs font-bold uppercase text-coral">Investor view</p>
          <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">
            Centre ranking
          </h1>
          <p className="max-w-[640px] text-base leading-[1.5] text-muted">
            Compare hawker centres by takings, how much is paid cashless, and hygiene grade.
          </p>
        </Reveal>
        {state.status === 'error' && (
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60"
          >
            Try again
          </button>
        )}
        {body}
      </div>
    </div>
  )
}
