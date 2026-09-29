import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Reveal from '../components/Reveal.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useMenu } from '../context/MenuContext.jsx'
import StallRating from '../components/StallRating.jsx'

// Real menu_item rows have no photo (GET /stalls/:id/menu only sends menu_item_id,
// name, price, is_available — see docs/api-contract.md), so dishes get a plain
// placeholder instead of a stock photo that would misrepresent a real dish.
function DishThumb({ className = '' }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-lg bg-cream text-3xl ${className}`}>
      🍽️
    </div>
  )
}

// Derived from real fields only (price, is_available) — the mock's
// Popular/Chicken rice/Halal tags had no equivalent in the real menu_item row.
const FILTERS = ['All', 'Under $10']

function GridIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function ListIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="1" y="2" width="14" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="1" y="6.75" width="14" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="1" y="11.5" width="14" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  )
}

function QuantityStepper({ quantity, onAdd, onRemove, dishName, maxQuantity, disabled }) {
  if (disabled) {
    return <span className="text-xs font-bold uppercase text-muted">Sold out</span>
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${dishName} to basket`}
        className="flex size-[30px] items-center justify-center rounded-full bg-lime text-lg font-bold text-black transition-all duration-150 hover:scale-110 hover:opacity-60 active:scale-95"
      >
        +
      </button>
    )
  }

  const atMax = quantity >= maxQuantity

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove one ${dishName} from basket`}
        className="flex size-[30px] items-center justify-center rounded-full bg-cream text-lg font-bold text-ink transition-all duration-150 hover:scale-110 hover:opacity-60 active:scale-95"
      >
        −
      </button>
      <span className="w-4 text-center text-sm font-bold text-ink">{quantity}</span>
      <button
        type="button"
        onClick={onAdd}
        disabled={atMax}
        aria-label={atMax ? `${dishName} basket limit reached` : `Add one more ${dishName} to basket`}
        title={atMax ? `Limit of ${maxQuantity} per dish` : undefined}
        className={`flex size-[30px] items-center justify-center rounded-full text-lg font-bold transition-all duration-150 ${
          atMax
            ? 'cursor-not-allowed bg-border text-muted'
            : 'bg-lime text-black hover:scale-110 hover:opacity-60 active:scale-95'
        }`}
      >
        +
      </button>
    </div>
  )
}

function StatusMessage({ title, body }) {
  return (
    <section id="order" className="flex w-full flex-col items-start bg-cream px-4 py-8 sm:px-8 lg:px-12">
      <Reveal className="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-muted">{body}</p>
      </Reveal>
    </section>
  )
}

export default function Order() {
  const { status, stall, dishes } = useMenu()
  const [activeFilter, setActiveFilter] = useState(FILTERS[0])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const navigate = useNavigate()
  const { basket, addToBasket, removeFromBasket, basketEntries, itemCount, subtotal, maxQuantityPerDish } =
    useCart()

  const visibleDishes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return dishes
      .filter((dish) => activeFilter !== 'Under $10' || dish.price < 10)
      .filter((dish) => !term || dish.name.toLowerCase().includes(term))
  }, [dishes, activeFilter, search])

  if (status === 'loading') {
    return <StatusMessage title="Loading the menu…" body="Fetching live stalls and dishes." />
  }

  if (status === 'unavailable') {
    return (
      <StatusMessage
        title="Menu unavailable right now"
        body="Can't reach the API — make sure backend/app.py is running and VITE_API_BASE_URL is set."
      />
    )
  }

  if (status === 'empty' || !stall) {
    return <StatusMessage title="No stalls or dishes yet" body="Check back once the centres/stalls are seeded." />
  }

  return (
    <section id="order" className="flex w-full flex-col items-start bg-cream">
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row lg:gap-[30px] lg:px-12 lg:py-[34px]">
        <div className="flex flex-1 flex-col items-start gap-[22px]">
          <Reveal className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-[28px] font-extrabold text-ink sm:text-[34px]">What are you craving?</h2>
              <p className="text-sm text-muted">
                Dine-in at {stall.name}
                {stall.cuisine_type ? ` • ${stall.cuisine_type}` : ''}
                <StallRating stallId={stall.stall_id} className="ml-2 font-semibold text-ink" />
              </p>
            </div>
            <div className="w-full rounded-full bg-surface px-[15px] py-[11px] sm:w-60">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="⌕ Search dishes"
                className="w-full bg-transparent text-[13px] text-muted outline-none"
              />
            </div>
          </Reveal>

          <Reveal delay={100} className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-start gap-2.5">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 hover:opacity-60 ${
                    activeFilter === filter ? 'bg-ink text-white' : 'bg-surface text-ink'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full bg-surface p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 hover:opacity-60 ${
                  viewMode === 'grid' ? 'bg-ink text-white' : 'text-muted'
                }`}
              >
                <GridIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 hover:opacity-60 ${
                  viewMode === 'list' ? 'bg-ink text-white' : 'text-muted'
                }`}
              >
                <ListIcon className="size-4" />
              </button>
            </div>
          </Reveal>

          {visibleDishes.length === 0 ? (
            <Reveal className="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6">
              <p className="text-sm font-bold text-ink">No dishes match</p>
              <p className="text-xs text-muted">Try a different search or filter.</p>
            </Reveal>
          ) : viewMode === 'grid' ? (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDishes.map((dish, index) => (
                <Reveal
                  key={dish.menu_item_id}
                  delay={index * 100}
                  className="flex flex-col items-start gap-2.5 rounded-2xl bg-surface p-2.5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <DishThumb className="h-[178px] w-full" />
                  <p className="text-[15px] font-bold text-ink">{dish.name}</p>
                  <div className="flex w-full items-center justify-between">
                    <p className="text-base font-extrabold text-ink">${dish.price.toFixed(2)}</p>
                    <QuantityStepper
                      quantity={basket[dish.menu_item_id] ?? 0}
                      onAdd={() => addToBasket(dish.menu_item_id)}
                      onRemove={() => removeFromBasket(dish.menu_item_id)}
                      dishName={dish.name}
                      maxQuantity={maxQuantityPerDish}
                      disabled={!dish.is_available}
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="flex w-full flex-col items-start gap-3">
              {visibleDishes.map((dish, index) => (
                <Reveal
                  key={dish.menu_item_id}
                  delay={index * 80}
                  className="flex w-full items-center gap-4 rounded-2xl bg-surface p-3 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <DishThumb className="size-[72px]" />
                  <div className="flex flex-1 flex-col items-start gap-0.5">
                    <p className="text-[15px] font-bold text-ink">{dish.name}</p>
                  </div>
                  <p className="text-base font-extrabold text-ink">${dish.price.toFixed(2)}</p>
                  <QuantityStepper
                    quantity={basket[dish.menu_item_id] ?? 0}
                    onAdd={() => addToBasket(dish.menu_item_id)}
                    onRemove={() => removeFromBasket(dish.menu_item_id)}
                    dishName={dish.name}
                    maxQuantity={maxQuantityPerDish}
                    disabled={!dish.is_available}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <Reveal
          delay={200}
          className="flex w-full flex-col items-start gap-[18px] rounded-3xl bg-forest p-6 lg:h-full lg:w-[300px] lg:shrink-0"
        >
          <p className="text-[22px] font-extrabold text-white">Your basket · {itemCount}</p>
          <p className="text-xs text-lime">{stall.name.toUpperCase()}</p>

          {basketEntries.map(({ dish, quantity }) => (
            <div key={dish.menu_item_id} className="flex w-full items-center justify-between text-sm text-white">
              <p>
                {quantity}× {dish.name}
              </p>
              <div className="flex items-center gap-2.5">
                <p className="font-bold">${(dish.price * quantity).toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() => removeFromBasket(dish.menu_item_id)}
                  aria-label={`Remove one ${dish.name} from basket`}
                  className="flex size-5 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white transition-all duration-150 hover:scale-110 hover:opacity-60 active:scale-95"
                >
                  −
                </button>
              </div>
            </div>
          ))}

          <div className="h-px w-full bg-white/20" />

          <div className="flex w-full items-start justify-between text-white">
            <p className="text-[15px]">Total</p>
            <p className="text-xl font-extrabold">${subtotal.toFixed(2)}</p>
          </div>

          <Button
            variant="lime"
            disabled={itemCount === 0}
            onClick={() => navigate('/checkout')}
            className="w-full justify-center"
          >
            Checkout
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
