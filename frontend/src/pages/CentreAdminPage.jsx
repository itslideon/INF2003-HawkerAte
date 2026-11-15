import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import StatusNotice from '../components/StatusNotice.jsx'
import { useMenu } from '../context/MenuContext.jsx'
import { getAdminSummary } from '../lib/dashboardApi.js'
import { BLANK, count, hour, money, text } from '../lib/display.js'

// Centre admin: compare the stalls in one centre (GET /centres/:id/admin-summary).
// Shows exactly what the API returns: null -> "—", 0 -> 0. Grades are blank until real SFA data
// is loaded, star ratings are blank when Mongo is down (ratings_available: false), and a stall with
// no paid orders has revenue 0 but no average ticket / peak hour. Single-centre MVP, like the diner
// side: uses the first centre from MenuContext.
export default function CentreAdminPage() {
  const { status: menuStatus, centre } = useMenu()
  const centreId = centre?.centre_id

  const [state, setState] = useState({ status: 'loading' }) // loading | ready | error
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (centreId == null) return undefined
    let cancelled = false
    setState({ status: 'loading' })
    getAdminSummary(centreId).then((result) => {
      if (cancelled) return
      setState(result.ok ? { status: 'ready', data: result.data } : { status: 'error', error: result.error })
    })
    return () => {
      cancelled = true
    }
  }, [centreId, attempt])

  let body
  if (menuStatus === 'loading' || (centreId != null && state.status === 'loading')) {
    body = (
      <StatusNotice
        title="Loading the centre…"
        text="This can take a few seconds while the ratings are fetched."
      />
    )
  } else if (centreId == null) {
    body = (
      <StatusNotice
        title="No centre to show"
        text="Can't load a centre — make sure backend/app.py is running and the centre data is loaded."
      />
    )
  } else if (state.status === 'error') {
    body = (
      <StatusNotice
        title="Centre summary unavailable"
        text={`${state.error} (Needs backend/app.py running and sql/views/v_admin_centre_compare.sql applied.)`}
      />
    )
  } else {
    body = <Summary data={state.data} />
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 py-8 sm:px-8 lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-2">
          <p className="text-xs font-bold uppercase text-coral">Centre admin</p>
          <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">
            {state.status === 'ready' ? state.data.centre_name : (centre?.name ?? 'Centre admin')}
          </h1>
          <p className="max-w-[640px] text-base leading-[1.5] text-muted">
            Compare the stalls in this centre by revenue, grade, peak hour and ratings, and spot stalls with many refunds
            or low ratings.
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

function Summary({ data }) {
  const stalls = data.stalls ?? []

  return (
    <div className="flex w-full flex-col gap-4">
      {!data.ratings_available && (
        <StatusNotice
          tone="warn"
          title="Star ratings unavailable right now"
          text="The reviews database isn't reachable, so ratings and low-rating flags are blank. Everything else is live."
        />
      )}

      {stalls.length === 0 ? (
        <StatusNotice title="No live stalls in this centre yet" />
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase text-muted">
                <th className="px-4 py-3">Stall</th>
                <th className="px-3 py-3">Grade</th>
                <th className="px-3 py-3 text-right">Revenue</th>
                <th className="px-3 py-3 text-right">Avg ticket</th>
                <th className="px-3 py-3 text-right">Orders</th>
                <th className="px-3 py-3 text-right">Peak hour</th>
                <th className="px-3 py-3 text-right">Refunds</th>
                <th className="px-4 py-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {stalls.map((stall) => (
                <tr key={stall.stall_id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">{stall.stall_name}</p>
                    <p className="text-xs text-muted">{text(stall.cuisine_type)}</p>
                  </td>
                  <td className="px-3 py-3 font-bold text-ink" title={stall.grade ? undefined : 'No SFA grade loaded yet'}>
                    {text(stall.grade)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-ink">{money(stall.revenue)}</td>
                  <td className="px-3 py-3 text-right text-ink">{money(stall.avg_ticket)}</td>
                  <td className="px-3 py-3 text-right text-ink">{count(stall.order_count)}</td>
                  <td className="px-3 py-3 text-right text-ink">{hour(stall.peak_hour)}</td>
                  <td className="px-3 py-3 text-right text-ink">
                    {count(stall.refund_count)}
                    {Boolean(stall.many_refunds) && <Flag>Many refunds</Flag>}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    <Rating stall={stall} available={data.ratings_available} />
                    {Boolean(stall.low_rating) && <Flag>Low rating</Flag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="max-w-[640px] text-xs leading-[1.5] text-muted">
        {BLANK} means there is no data for that yet (no paid orders, no SFA grade loaded, or ratings unavailable). 0 is a
        real zero. Nothing here is estimated.
      </p>
    </div>
  )
}

// Three honest states: Mongo down (blank), no reviews yet, or a real average.
function Rating({ stall, available }) {
  if (!available) return BLANK
  if (!stall.review_count) return <span className="text-muted">No reviews yet</span>
  return (
    <span>
      ★ {Number(stall.avg_rating).toFixed(1)} <span className="text-muted">({stall.review_count})</span>
    </span>
  )
}

function Flag({ children }) {
  return (
    <span className="ml-2 inline-block rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold uppercase text-coral">
      {children}
    </span>
  )
}
