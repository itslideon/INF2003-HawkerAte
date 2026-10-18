import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { getOrdersForUser, updateOrderStatus } from '../lib/orderStore.js'
import { getOrderQueue, markOrderReady } from '../lib/queueApi.js'

const OrderTrackerContext = createContext(null)
const POLL_MS = 3000

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

function isNowServing(queue) {
  if (!queue) return false
  if (queue.in_queue === false) return true
  return Number(queue.ahead) === 0
}

export function OrderTrackerProvider({ children }) {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState({}) // order_id -> 'preparing' | 'ready' | 'collected'
  const [queues, setQueues] = useState({}) // order_id -> API queue payload
  const [sessionOrders, setSessionOrders] = useState({})
  const [notices, setNotices] = useState([])
  const readyNotified = useRef(new Set())

  const announceReady = useCallback((order) => {
    const id = order.order_id
    if (readyNotified.current.has(id)) return
    readyNotified.current.add(id)
    setStatuses((prev) => ({ ...prev, [id]: 'ready' }))
    if (order.customer_id) updateOrderStatus(order.customer_id, id, 'ready')
    setNotices((prev) => [
      ...prev,
      { id, orderId: id, stallName: order.stall_name },
    ])
    showBrowserNotification('Your food is ready!', `Order ${id} — collect it at ${order.stall_name}.`)
  }, [])

  const applyQueue = useCallback(
    (order, queue) => {
      if (!queue) return
      setQueues((prev) => ({ ...prev, [order.order_id]: queue }))
      if (queue.in_queue === false) {
        setStatuses((prev) => ({ ...prev, [order.order_id]: 'collected' }))
        if (order.customer_id) updateOrderStatus(order.customer_id, order.order_id, 'collected')
        return
      }
      if (isNowServing(queue)) announceReady(order)
      else setStatuses((prev) => ({ ...prev, [order.order_id]: prev[order.order_id] ?? 'preparing' }))
    },
    [announceReady],
  )

  const trackOrder = useCallback(
    (order, queueFromPay) => {
      setSessionOrders((prev) => ({ ...prev, [order.order_id]: order }))
      setStatuses((prev) => ({ ...prev, [order.order_id]: 'preparing' }))
      if (queueFromPay) applyQueue(order, queueFromPay)
    },
    [applyQueue],
  )

  const collectOrder = useCallback(async (orderId) => {
    const result = await markOrderReady(orderId)
    if (result?.ok === false) return result
    setStatuses((prev) => ({ ...prev, [orderId]: 'collected' }))
    setQueues((prev) => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), in_queue: false, ahead: 0 },
    }))
    return result ?? { ok: true }
  }, [])

  const dismissNotice = useCallback((id) => {
    setNotices((prev) => prev.filter((notice) => notice.id !== id))
  }, [])

  const getOrder = useCallback(
    (orderId) =>
      sessionOrders[orderId] ??
      (user
        ? getOrdersForUser(user.customer_id).find((order) => String(order.order_id) === String(orderId))
        : undefined),
    [sessionOrders, user],
  )

  useEffect(() => {
    if (!user) return
    getOrdersForUser(user.customer_id)
      .filter((order) => order.status === 'preparing' || order.status === 'ready')
      .forEach((order) => {
        setSessionOrders((prev) => (prev[order.order_id] ? prev : { ...prev, [order.order_id]: order }))
        setStatuses((prev) => ({ ...prev, [order.order_id]: prev[order.order_id] ?? order.status }))
      })
  }, [user])

  useEffect(() => {
    const ids = Object.keys(sessionOrders)
    if (ids.length === 0) return undefined

    let cancelled = false

    const poll = async () => {
      for (const id of ids) {
        if (cancelled) return
        const order = sessionOrders[id]
        const data = await getOrderQueue(id)
        if (!data || cancelled) continue
        applyQueue(order, data)
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [sessionOrders, applyQueue])

  const value = useMemo(
    () => ({ statuses, queues, notices, trackOrder, collectOrder, dismissNotice, getOrder }),
    [statuses, queues, notices, trackOrder, collectOrder, dismissNotice, getOrder],
  )

  return <OrderTrackerContext.Provider value={value}>{children}</OrderTrackerContext.Provider>
}

export function useOrderTracker() {
  const ctx = useContext(OrderTrackerContext)
  if (!ctx) throw new Error('useOrderTracker must be used within OrderTrackerProvider')
  return ctx
}
