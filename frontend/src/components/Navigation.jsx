import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import brandMark from '../assets/brand-mark.svg'
import accountAvatar from '../assets/account-avatar.svg'
import { useAuth } from '../context/AuthContext.jsx'

const sectionLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'order', label: 'Order' },
  { id: 'insights', label: 'Insights' },
  { id: 'contact', label: 'Contact' },
]

const linkClass = (active) =>
  `group relative py-1 transition-colors duration-200 ${
    active ? 'font-bold text-forest' : 'font-medium text-muted hover:text-ink'
  }`

const underlineClass = (active) =>
  `pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 bg-forest transition-transform duration-300 ease-out group-hover:scale-x-100 ${
    active ? 'scale-x-100' : ''
  }`

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const onMainSite = location.pathname === '/'

  useEffect(() => {
    if (!onMainSite) return
    const sections = sectionLinks.map((link) => document.getElementById(link.id)).filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (mostVisible) setActiveSection(mostVisible.target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [onMainSite])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const goToSection = (event, id) => {
    event.preventDefault()
    setMobileOpen(false)
    if (onMainSite) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/', { state: { scrollTo: id } })
    }
  }

  const sessionSlot = user ? (
    <Link to="/account" className="flex shrink-0 items-center gap-2">
      <img src={accountAvatar} alt="" className="size-8 rounded-full bg-forest" />
      <span className="hidden text-sm font-bold text-ink sm:inline">{user.name.split(' ')[0]}</span>
    </Link>
  ) : (
    <Link
      to="/login"
      className="shrink-0 rounded-full bg-lime px-[18px] py-[11px] text-sm font-bold text-ink transition-opacity duration-200 hover:opacity-60"
    >
      Login ↗
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 flex w-full shrink-0 flex-col bg-surface/90 backdrop-blur">
      <div className="flex h-[99px] w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src={brandMark} alt="HawkerAte" className="size-[34px]" />
          <span className="text-[20px] font-extrabold text-ink">HawkerAte</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {sectionLinks.map((link) => {
            const active = onMainSite && activeSection === link.id
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => goToSection(event, link.id)}
                className={linkClass(active)}
              >
                {link.label}
                <span className={underlineClass(active)} />
              </a>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {sessionSlot}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="flex size-9 items-center justify-center rounded-full text-ink transition-opacity duration-200 hover:opacity-60 md:hidden"
          >
            {mobileOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="flex flex-col items-start gap-1 border-t border-border px-4 pb-5 pt-3 md:hidden">
          {sectionLinks.map((link) => {
            const active = onMainSite && activeSection === link.id
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => goToSection(event, link.id)}
                className={`w-full rounded-lg px-2 py-2.5 text-sm ${
                  active ? 'font-bold text-forest' : 'font-medium text-muted'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </div>
      )}
    </nav>
  )
}
