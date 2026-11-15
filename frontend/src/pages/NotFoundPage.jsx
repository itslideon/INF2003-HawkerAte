import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import Button from '../components/Button.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xs font-bold uppercase text-coral">404</p>
        <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px]">Page not found</h1>
        <p className="max-w-[420px] text-base text-muted">That address doesn't go anywhere on this site.</p>
        <Button variant="dark" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </div>
    </div>
  )
}
