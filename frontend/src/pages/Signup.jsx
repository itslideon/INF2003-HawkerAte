import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Button from '../components/Button.jsx'
import Reveal from '../components/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submitSignup = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    const fullName = `${firstName} ${lastName}`.trim()
    signIn(email, fullName)
    navigate('/account')
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-center gap-10 px-4 py-10 sm:px-8 lg:flex-row lg:gap-[72px] lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-1 flex-col items-start gap-7">
          <div className="flex w-full flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Join HawkerAte</p>
            <h1 className="text-[34px] font-extrabold leading-[1.05] text-ink sm:text-[46px]">
              Pull up a seat at the table.
            </h1>
            <p className="max-w-[460px] text-base leading-[1.5] text-muted">
              Create an account to save your favourite stalls, keep an order history, and reorder in a tap.
            </p>
          </div>
          <div className="flex w-full max-w-[430px] flex-col items-start gap-2 rounded-2xl bg-forest p-5">
            <p className="text-[17px] font-bold text-white">Free, always</p>
            <p className="text-sm leading-[1.5] text-white/73">
              No subscriptions — just a faster way to order from your favourite hawker stalls.
            </p>
          </div>
        </Reveal>

        <Reveal
          delay={150}
          as="form"
          onSubmit={submitSignup}
          className="flex w-full max-w-[470px] flex-col items-start gap-[18px] rounded-3xl bg-surface p-6 sm:p-8 lg:shrink-0"
        >
          <p className="text-2xl font-extrabold text-ink">Create your account</p>
          <div className="flex w-full flex-col gap-[18px] sm:flex-row">
            <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
              <span className="text-[11px] font-bold text-muted">FIRST NAME</span>
              <input
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jamie"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>
            <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
              <span className="text-[11px] font-bold text-muted">LAST NAME</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Tan"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>
          </div>
          <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
            <span className="text-[11px] font-bold text-muted">EMAIL</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jamie@example.com"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
          <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
            <span className="text-[11px] font-bold text-muted">PASSWORD</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
          <Button variant="dark" type="submit" className="w-full justify-center">
            Create account
          </Button>
          <p className="w-full text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ink transition-opacity duration-200 hover:opacity-60">
              Sign in
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  )
}
