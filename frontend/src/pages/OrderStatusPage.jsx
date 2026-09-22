import { useNavigate, useParams } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Button from '../components/Button.jsx'
import OrderConfirmation from '../components/OrderConfirmation.jsx'
import { useOrderTracker } from '../context/OrderTrackerContext.jsx'

export default function OrderStatusPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { statuses, getOrder } = useOrderTracker()
  const order = getOrder(orderId)

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-cream">
      <Navigation />
      {order ? (
        <OrderConfirmation
          order={order}
          isReady={(statuses[order.order_id] ?? order.status) === 'ready'}
          heading="Your order"
        />
      ) : (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-2xl font-extrabold text-ink">We couldn't find that order</p>
          <p className="max-w-[420px] text-base text-muted">
            Orders placed as a guest are only kept until you close the tab. Sign in to keep your order history.
          </p>
          <Button variant="dark" onClick={() => navigate('/')}>
            Back to menu
          </Button>
        </div>
      )}
    </div>
  )
}
