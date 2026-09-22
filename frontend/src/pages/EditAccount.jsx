import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function EditAccount() {
  const { user, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] ?? '')
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('+65 9123 4567')
  const [address, setAddress] = useState('8 Tanjong Pagar Plaza, #12-04')
  const [notifyOffers, setNotifyOffers] = useState(true)

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  if (!user) return null

  const saveChanges = (event) => {
    event.preventDefault()
    updateProfile({ name: `${firstName} ${lastName}`.trim(), email })
    navigate('/account')
  }

  const deleteAccount = () => {
    if (window.confirm('Delete your account? This removes your saved orders on this device.')) {
      signOut()
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-8 px-4 py-8 sm:px-8 lg:flex-row lg:gap-14 lg:px-16 lg:py-[42px]">
        <Reveal className="flex w-full flex-col items-start gap-[26px] lg:w-[390px] lg:shrink-0">
          <div className="flex w-full flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Account settings</p>
            <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">Make it yours.</h1>
            <p className="text-base leading-[1.5] text-muted">
              Keep your contact details up to date for a smoother next order.
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-2 rounded-2xl bg-forest p-5">
            <p className="text-base font-bold text-white">Your details stay private</p>
            <p className="text-[13px] leading-[1.5] text-white/73">
              We only use this information to fulfil orders and contact you about your account.
            </p>
          </div>
          <button
            type="button"
            onClick={deleteAccount}
            className="rounded-full bg-[#b43b2a] px-5 py-3 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60"
          >
            Delete account ↗
          </button>
        </Reveal>

        <Reveal
          delay={100}
          as="form"
          onSubmit={saveChanges}
          className="flex w-full flex-1 flex-col items-start gap-[15px] rounded-3xl bg-surface p-5 sm:p-[30px]"
        >
          <p className="text-[22px] font-extrabold text-ink">Personal details</p>
          <div className="flex w-full flex-col items-start gap-3.5 sm:flex-row">
            <label className="flex h-[60px] flex-1 flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
              <span className="text-[11px] font-bold text-muted">FIRST NAME</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </label>
            <label className="flex h-[60px] flex-1 flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
              <span className="text-[11px] font-bold text-muted">LAST NAME</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </label>
          </div>
          <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
            <span className="text-[11px] font-bold text-muted">EMAIL</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
            <span className="text-[11px] font-bold text-muted">PHONE</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <label className="flex h-[60px] w-full flex-col items-start gap-1 rounded-lg border border-border px-[15px] py-2.5">
            <span className="text-[11px] font-bold text-muted">HOME ADDRESS</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>

          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm font-bold text-ink">Hawker highlights & offers</p>
              <p className="text-xs text-muted">Email me occasional recommendations</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyOffers}
              onClick={() => setNotifyOffers((value) => !value)}
              className={`flex h-6 w-[42px] items-center rounded-full p-[3px] transition-colors duration-200 ${
                notifyOffers ? 'justify-end bg-forest' : 'justify-start bg-border'
              }`}
            >
              <span className="size-[18px] rounded-full bg-white transition-transform duration-200" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-60"
            >
              Save changes ↗
            </button>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="rounded-full bg-lime px-5 py-3 text-sm font-bold text-ink transition-opacity duration-200 hover:opacity-60"
            >
              Cancel ↗
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
