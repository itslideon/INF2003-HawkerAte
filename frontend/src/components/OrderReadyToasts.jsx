import { Link } from 'react-router-dom'
import { useOrderTracker } from '../context/OrderTrackerContext.jsx'

export default function OrderReadyToasts() {
  const { notices, dismissNotice } = useOrderTracker()

  if (notices.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-[110px] z-[60] flex w-[calc(100%-2rem)] max-w-[360px] flex-col gap-3"
    >
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="animate-scale-in flex items-start gap-3 rounded-2xl bg-forest p-4 shadow-lg"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-lg text-ink">
            ✓
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-base font-extrabold text-white">Your food is ready!</p>
            <p className="text-[13px] leading-[1.5] text-white/73">
              Order {notice.orderId} is ready to collect at {notice.stallName}.
            </p>
            <Link
              to={`/orders/${notice.orderId}`}
              onClick={() => dismissNotice(notice.id)}
              className="mt-2 w-fit rounded-full bg-lime px-3.5 py-1.5 text-[13px] font-bold text-ink transition-opacity duration-200 hover:opacity-60"
            >
              View order
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismissNotice(notice.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-lg leading-none text-white/73 transition-opacity duration-200 hover:opacity-60"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
