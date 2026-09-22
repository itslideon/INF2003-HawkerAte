import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { MOCK_READY_DELAY_MS, getOrdersForUser, updateOrderStatus } from '../lib/orderStore.js'

const OrderTrackerContext = createContext(null)

// browser notifications are a bonus on top of the in-app banner — always feature-check,
// and never let a blocked/unsupported API break the order flow
function canUseBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function requestNotificationPermission() {
  if (!canUseBrowserNotifications() || Notification.permission !== 'default') return
  try {
    Notification.requestPermission()
  } catch {
    // older browsers use a callback form — not worth supporting
  }
}

function showBrowserNotification(title, body) {
  if (!canUseBrowserNotifications() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body })
  } catch {
    // e.g. some mobile browsers only allow notifications from a service worker
  }
}

export function OrderTrackerProvider({ children }) {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState({}) // order_id -> 'preparing' | 'ready'
  const [sessionOrders, setSessionOrders] = useState({}) // orders placed in this tab, guests included
  const [notices, setNotices] = useState([])
  const timers = useRef(new Map())

  const markReady = useCallback((order) => {
    timers.current.delete(order.order_id)
    setStatuses((prev) => ({ ...prev, [order.order_id]: 'ready' }))
    if (order.customer_id) updateOrderStatus(order.customer_id, order.order_id, 'ready')
    setNotices((prev) => [
      ...prev,
      { id: order.order_id, orderId: order.order_id, stallName: order.stall_name },
    ])
    showBrowserNotification('Your food is ready!', `Order ${order.order_id} — collect it at ${order.stall_name}.`)
  }, [])

  const scheduleReady = useCallback(
    (order, delayMs) => {
      if (timers.current.has(order.order_id)) return
      timers.current.set(order.order_id, setTimeout(() => markReady(order), delayMs))
    },
    [markReady],
  )

  const trackOrder = useCallback(
    (order) => {
      setSessionOrders((prev) => ({ ...prev, [order.order_id]: order }))
      setStatuses((prev) => ({ ...prev, [order.order_id]: 'preparing' }))
      scheduleReady(order, MOCK_READY_DELAY_MS)
    },
    [scheduleReady],
  )

  const dismissNotice = useCallback((id) => {
    setNotices((prev) => prev.filter((notice) => notice.id !== id))
  }, [])

  // pick up orders still preparing after a reload / re-login, so the alert isn't lost
  useEffect(() => {
    if (!user) return
    getOrdersForUser(user.customer_id)
      .filter((order) => order.status === 'preparing')
      .forEach((order) => {
        const remaining = new Date(order.placed_at).getTime() + MOCK_READY_DELAY_MS - Date.now()
        setStatuses((prev) => ({ ...prev, [order.order_id]: prev[order.order_id] ?? 'preparing' }))
        scheduleReady(order, Math.max(remaining, 0))
      })
  }, [user, scheduleReady])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const getOrder = useCallback(
    (orderId) =>
      sessionOrders[orderId] ??
      (user ? getOrdersForUser(user.customer_id).find((order) => order.order_id === orderId) : undefined),
    [sessionOrders, user],
  )

  const value = useMemo(
    () => ({ statuses, notices, trackOrder, dismissNotice, getOrder }),
    [statuses, notices, trackOrder, dismissNotice, getOrder],
  )

  return <OrderTrackerContext.Provider value={value}>{children}</OrderTrackerContext.Provider>
}

export function useOrderTracker() {
  const ctx = useContext(OrderTrackerContext)
  if (!ctx) throw new Error('useOrderTracker must be used within OrderTrackerProvider')
  return ctx
}
