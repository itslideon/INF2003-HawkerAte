import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Footer from '../components/Footer.jsx'
import BackToTop from '../components/BackToTop.jsx'
import Home from '../sections/Home.jsx'
import HowItWorks from '../sections/HowItWorks.jsx'
import About from '../sections/About.jsx'
import Testimonials from '../sections/Testimonials.jsx'
import Order from '../sections/Order.jsx'
import LiveStats from '../sections/LiveStats.jsx'
import Insights from '../sections/Insights.jsx'
import PartnerCTA from '../sections/PartnerCTA.jsx'
import Contact from '../sections/Contact.jsx'

export default function MainSite() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const targetId = location.state?.scrollTo
    if (!targetId) return

    const frame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    navigate(location.pathname, { replace: true, state: {} })

    return () => cancelAnimationFrame(frame)
  }, [location.state, location.pathname, navigate])

  return (
    <div className="flex w-full flex-col items-start">
      <Navigation />
      <Home />
      <HowItWorks />
      <About />
      <Testimonials />
      <Order />
      <LiveStats />
      <Insights />
      <PartnerCTA />
      <Contact />
      <Footer />
      <BackToTop />
    </div>
  )
}
