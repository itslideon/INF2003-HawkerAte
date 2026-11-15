import Reveal from '../components/Reveal.jsx'
import { useSettlement } from '../lib/useSettlement.js'

// Real numbers from GET /settlement (today). "—" while loading or if the API is down,
// never a made-up figure. Wait time isn't tracked anywhere, so it's not shown.
export default function LiveStats() {
  const { status, summary } = useSettlement()
  const ready = status === 'ready'

  const stats = [
    { value: ready ? summary.orders.toLocaleString() : '—', label: 'orders served today' },
    { value: ready ? summary.stallCount.toLocaleString() : '—', label: 'stalls with orders today' },
    { value: ready ? `$${summary.sales.toFixed(2)}` : '—', label: 'sales today' },
  ]

  return (
    <section className="flex w-full flex-col items-start gap-8 bg-ink px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-14">
      <div className="flex w-full flex-wrap items-start gap-8 lg:w-auto">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 100} className="flex flex-col items-start gap-1">
            <p className="text-[32px] font-extrabold text-lime">{stat.value}</p>
            <p className="text-sm text-white/70">{stat.label}</p>
          </Reveal>
        ))}
      </div>
      <Reveal delay={300} className="max-w-[320px] text-sm leading-[1.6] text-white/70">
        {status === 'unavailable'
          ? "Can't reach the API right now, so there are no numbers to show."
          : 'Counted from paid orders today and refreshed every 30 seconds. Refunded orders are not counted.'}
      </Reveal>
    </section>
  )
}
