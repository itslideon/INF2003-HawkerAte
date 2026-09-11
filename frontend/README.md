# Frontend — Owner: KRISTEN

This is where the app code lives. Put the actual project here (the
existing ordering/payment-flow build with mock-mode data already
covers login, diner browse, cart, checkout, and a PayNow-style payment
screen).

- `../docs/api-contract.md` — exact endpoints/fields this UI expects
  from Lideon's backend. Swap the mock data layer for real fetch calls
  against `API_BASE_URL` (see `../.env.example`) once each endpoint is live.
- Keep a "waiting for backend" state for anything not in the contract
  yet — no hardcoded fake stalls/totals in the Iter 1–2 demos.

TODO Kristen: sketch (don't have to build yet) the owner/admin/investor
routes per the Iter 1 plan; wire diner browse to real `/centres` and
`/centres/:id/stalls` reads for the 3 Oct demo.
