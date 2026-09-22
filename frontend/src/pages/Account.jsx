import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useOrderTracker } from '../context/OrderTrackerContext.jsx'
import { getOrdersForUser, paymentMethodLabel } from '../lib/orderStore.js'
import accountAvatar from '../assets/account-avatar.svg'

const favourites = [
  { name: 'Tian Tian Chicken Rice', rating: '4.9' },
  { name: '328 Katong Laksa', rating: '4.8' },
  { name: 'Outram Park Fried Kway Teow', rating: '4.8' },
]

export default function Account() {
  const { user } = useAuth()
  const { statuses } = useOrderTracker() // re-renders this page when an order flips to ready
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  if (!user) return null

  const latestOrder = getOrdersForUser(user.customer_id)[0]

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 pb-10 pt-8 sm:px-8 lg:px-16 lg:pt-9">
        <Reveal className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex w-full max-w-[620px] flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Your table</p>
            <h1 className="text-[32px] font-extrabold leading-[1.05] text-ink sm:text-[46px]">
              Good evening, {user.name.split(' ')[0]}.
            </h1>
            <p className="text-base leading-[1.5] text-muted">
              Manage your details, favourite stalls, and everything you've ordered.
            </p>
          </div>
          <Button variant="dark" onClick={() => navigate('/account/edit')}>
            Edit account
          </Button>
        </Reveal>

        <div className="flex w-full flex-1 flex-col items-start gap-[18px] lg:flex-row">
          <Reveal
            delay={100}
            className="flex w-full flex-col items-start gap-[18px] rounded-3xl bg-forest p-6 lg:h-full lg:w-[330px] lg:shrink-0"
          >
            <img src={accountAvatar} alt="" className="size-16" />
            <p className="text-2xl font-extrabold text-white">{user.name}</p>
            <p className="text-sm text-white/73">{user.email}</p>
            <div className="h-px w-full bg-white/20" />
            <p className="text-[13px] text-lime">HAWKERATE MEMBER SINCE 2024</p>
            <div className="text-sm text-white">
              <p>8 Tanjong Pagar Plaza</p>
              <p>Singapore 081008</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/logout')}
              className="text-sm font-semibold text-white/73 transition-opacity duration-200 hover:opacity-60"
            >
              Log out
            </button>
          </Reveal>

          <div className="flex w-full flex-1 flex-col items-start gap-[18px]">
            <Reveal delay={150} className="flex w-full flex-col items-start gap-3.5 rounded-3xl bg-surface p-6">
              <p className="text-xl font-extrabold text-ink">Recent order</p>
              {latestOrder ? (
                <>
                  <div className="flex w-full flex-col items-start justify-between gap-1 text-sm sm:flex-row">
                    <p className="text-muted">{latestOrder.stall_name}</p>
                    <p className="font-bold text-ink">
                      {new Date(latestOrder.placed_at).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex w-full flex-col items-start justify-between gap-1 text-sm sm:flex-row">
                    <p className="text-muted">
                      {latestOrder.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                    </p>
                    <p className="font-bold text-ink">${latestOrder.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="flex w-full flex-col items-start justify-between gap-1 text-sm sm:flex-row">
                    <p className="text-muted">
                      {latestOrder.method ? `Paid with ${paymentMethodLabel(latestOrder.method)}` : 'Payment method not recorded'}
                    </p>
                    {(statuses[latestOrder.order_id] ?? latestOrder.status) === 'ready' ? (
                      <p className="font-bold text-success">Ready to collect</p>
                    ) : (statuses[latestOrder.order_id] ?? latestOrder.status) === 'preparing' ? (
                      <p className="font-bold text-amber">Preparing…</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="dark" onClick={() => navigate(`/orders/${latestOrder.order_id}`)}>
                      View order
                    </Button>
                    <Button
                      variant="lime"
                      onClick={() => navigate('/', { state: { scrollTo: 'order' } })}
                    >
                      Order again
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">No orders yet — your next order will show up here.</p>
              )}
            </Reveal>

            <Reveal delay={200} className="flex w-full flex-col items-start gap-3.5 rounded-3xl bg-surface p-6">
              <p className="text-xl font-extrabold text-ink">Favourite stalls</p>
              {favourites.map((stall) => (
                <div key={stall.name} className="flex w-full items-start justify-between text-sm">
                  <p className="text-muted">{stall.name}</p>
                  <p className="font-bold text-ink">★ {stall.rating}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
