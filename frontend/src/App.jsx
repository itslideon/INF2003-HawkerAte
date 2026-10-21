import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import MainSite from './pages/MainSite.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Logout from './pages/Logout.jsx'
import Account from './pages/Account.jsx'
import EditAccount from './pages/EditAccount.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderStatusPage from './pages/OrderStatusPage.jsx'
import OwnerPage from './pages/OwnerPage.jsx'
import StallQueuePage from './pages/StallQueuePage.jsx'
import OrderReadyToasts from './components/OrderReadyToasts.jsx'

function ScrollToTop() {
  const { pathname, state } = useLocation()

  useEffect(() => {
    if (pathname === '/' && state?.scrollTo) return
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <OrderReadyToasts />
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/edit" element={<EditAccount />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:orderId" element={<OrderStatusPage />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="/stall" element={<StallQueuePage />} />
      </Routes>
    </>
  )
}
