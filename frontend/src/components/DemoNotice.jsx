import { DEMO_CUSTOMER_ID } from '../lib/orderApi.js'

// This course project has no real accounts: no passwords, sessions or roles. Say so on the
// sign-in screens so nobody expects a password to be checked.
export default function DemoNotice({ className = '' }) {
  return (
    <p role="note" className={`rounded-xl bg-amber/25 p-3 text-xs leading-[1.5] text-ink ${className}`}>
      <span className="font-bold">Demo only.</span> There are no real accounts, so nothing here is checked. Orders are
      placed as the demo diner, customer {DEMO_CUSTOMER_ID}, using that customer's wallet in the database.
    </p>
  )
}
