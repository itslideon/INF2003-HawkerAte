import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import confirmationMark from '../assets/confirmation-mark.svg'

export default function Logout() {
  const { user, signOut } = useAuth()
  const [firstName] = useState(() => user?.name?.split(' ')[0] ?? 'there')

  useEffect(() => {
    signOut()
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 items-center justify-center px-4">
        <Reveal className="flex w-full max-w-[560px] flex-col items-center gap-5 rounded-3xl bg-surface p-6 text-center sm:p-[42px]">
          <img src={confirmationMark} alt="" className="size-16" />
          <h1 className="text-[30px] font-extrabold text-ink sm:text-[42px]">You're signed out.</h1>
          <p className="max-w-[430px] text-base leading-[1.55] text-muted">
            Thanks for stopping by, {firstName}. Your saved stalls and order history will be here when you
            return.
          </p>
          <div className="flex flex-wrap items-start justify-center gap-3">
            <Link
              to="/login"
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60"
            >
              Sign in again ↗
            </Link>
            <Link
              to="/"
              className="rounded-full bg-lime px-5 py-3 text-sm font-bold text-ink transition-opacity duration-200 hover:opacity-60"
            >
              Browse the menu ↗
            </Link>
          </div>
          <p className="text-xs text-muted">Signed out securely on this device.</p>
        </Reveal>
      </div>
    </div>
  )
}
