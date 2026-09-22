import { useNavigate } from 'react-router-dom'
import Reveal from './Reveal.jsx'
import { paymentMethodLabel } from '../lib/orderStore.js'

export default function OrderConfirmation({ order, isReady, heading }) {
  const navigate = useNavigate()

  return (
    <div className="flex w-full flex-1 items-center justify-center px-4 py-8">
      <Reveal className="flex w-full max-w-[520px] flex-col items-center gap-5 rounded-3xl bg-surface p-6 text-center sm:p-10">
        <div className="flex size-14 items-center justify-center rounded-full bg-lime text-2xl">✓</div>
        <h1 className="text-3xl font-extrabold text-ink">{heading}</h1>
        <p className="text-base text-muted">
          Show this order ID at the {order.stall_name} counter to collect your food.
        </p>
        <div className="flex w-full flex-col items-center gap-1 rounded-2xl bg-cream p-5">
          <p className="text-[11px] font-bold uppercase text-muted">Order ID</p>
          <p className="text-2xl font-extrabold tracking-wide text-ink">{order.order_id}</p>
        </div>
        <div
          className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left ${
            isReady ? 'bg-lime text-ink' : 'bg-forest text-white'
          }`}
          role="status"
        >
          <span
            className={`size-3 shrink-0 rounded-full ${isReady ? 'bg-forest' : 'animate-pulse-glow bg-amber'}`}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-extrabold">{isReady ? 'Your food is ready!' : 'Preparing your order…'}</p>
            <p className={`text-[13px] ${isReady ? 'text-ink/73' : 'text-white/73'}`}>
              {isReady
                ? `Collect it at the ${order.stall_name} counter.`
                : "Keep this page open — we'll alert you the moment it's ready."}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 text-left">
          {order.items.map((item) => (
            <div key={item.order_line_id} className="flex w-full items-start justify-between text-sm text-ink">
              <p>
                {item.quantity}× {item.name}
              </p>
              <p className="font-bold">${(item.unit_price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="flex w-full items-start justify-between border-t border-border pt-2 text-sm text-ink">
            <p>Total</p>
            <p className="font-extrabold">${order.total_amount.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-sm text-ink">
          {order.method === 'cash'
            ? `Pay $${order.total_amount.toFixed(2)} in cash at the counter.`
            : `Paid with ${paymentMethodLabel(order.method)} (simulated).`}
        </p>
        <p className="text-xs text-muted">
          {order.customer_id
            ? 'Saved to your orders — find it any time under your account.'
            : 'This order was not saved. Sign in next time to keep your order history.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60"
        >
          Back to menu
        </button>
      </Reveal>
    </div>
  )
}
