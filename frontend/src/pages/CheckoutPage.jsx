import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import Button from '../components/Button.jsx'
import OrderConfirmation from '../components/OrderConfirmation.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useOrderTracker, requestNotificationPermission } from '../context/OrderTrackerContext.jsx'
import {
  PAYMENT_METHODS,
  buildOrderLines,
  generateOrderId,
  paymentMethodLabel,
  saveOrderForUser,
} from '../lib/orderStore.js'
import { stallId, stallName } from '../data/dishes.js'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { basketEntries, subtotal, itemCount, clearBasket } = useCart()
  const navigate = useNavigate()
  const { statuses, trackOrder } = useOrderTracker()
  const [method, setMethod] = useState(null)
  const [placedOrder, setPlacedOrder] = useState(null)

  const placeOrder = () => {
    if (!method) return
    const newOrderId = generateOrderId()
    const order = {
      order_id: newOrderId,
      stall_id: stallId,
      stall_name: stallName,
      customer_id: user?.customer_id ?? null,
      items: buildOrderLines(newOrderId, basketEntries),
      total_amount: subtotal,
      method,
      status: 'preparing',
      placed_at: new Date().toISOString(),
    }

    if (user) saveOrderForUser(user.customer_id, order)

    // asked here because browsers only allow the permission prompt from a click
    requestNotificationPermission()
    trackOrder(order)
    setPlacedOrder(order)
    clearBasket()
  }

  if (placedOrder) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-cream">
        <Navigation />
        <OrderConfirmation
          order={placedOrder}
          isReady={statuses[placedOrder.order_id] === 'ready'}
          heading="Order placed!"
        />
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-cream">
        <Navigation />
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
          <p className="text-2xl font-extrabold text-ink">Your basket is empty</p>
          <Button variant="dark" onClick={() => navigate('/', { state: { scrollTo: 'order' } })}>
            Browse the menu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-8 px-4 py-8 sm:px-8 lg:flex-row lg:gap-[72px] lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-6 lg:w-[430px] lg:shrink-0">
          <div className="flex w-full flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Order summary</p>
            <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">Dine-in at {stallName}</h1>
            <p className="text-base leading-[1.5] text-muted">
              Enjoy your meal at the hawker centre — no delivery needed. Show your order ID at the counter
              when it's ready.
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-2 rounded-2xl bg-forest p-5">
            <p className="text-base font-bold text-white">
              {user ? `Ordering as ${user.name}` : 'Ordering as a guest'}
            </p>
            <p className="text-[13px] leading-[1.5] text-white/73">
              {user
                ? "We'll save this order to your account so you can find it again."
                : 'Sign in to save this order to your account.'}
            </p>
          </div>
        </Reveal>

        <Reveal delay={150} className="flex w-full flex-1 flex-col items-start gap-4 rounded-3xl bg-surface p-5 sm:p-8">
          <p className="text-2xl font-extrabold text-ink">Your order</p>
          <div className="flex w-full flex-col items-start gap-2.5">
            {basketEntries.map(({ dish, quantity }) => (
              <div key={dish.menu_item_id} className="flex w-full items-start justify-between text-sm text-ink">
                <p>
                  {quantity}× {dish.name}
                </p>
                <p className="font-bold">${(dish.price * quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="h-px w-full bg-border" />
          <div className="flex w-full items-start justify-between">
            <p className="text-base text-ink">Total</p>
            <p className="text-xl font-extrabold text-ink">${subtotal.toFixed(2)}</p>
          </div>
          <fieldset className="flex w-full flex-col items-start gap-2.5">
            <legend className="mb-2.5 text-base font-bold text-ink">Payment method</legend>
            {PAYMENT_METHODS.map((option) => (
              <label
                key={option.value}
                className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-border bg-cream/60 p-4 transition-colors duration-200 hover:border-forest has-[:checked]:border-forest has-[:checked]:bg-lime/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest"
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  className="mt-1 size-4 accent-forest"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-ink">{option.label}</span>
                  <span className="text-[13px] leading-[1.4] text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Button variant="dark" onClick={placeOrder} disabled={!method} className="w-full justify-center">
            {method ? `Place order · ${paymentMethodLabel(method)}` : 'Choose a payment method'}
          </Button>
        </Reveal>
      </div>
    </div>
  )
}
