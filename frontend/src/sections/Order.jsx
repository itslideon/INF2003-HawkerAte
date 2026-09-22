import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Reveal from '../components/Reveal.jsx'
import { useCart } from '../context/CartContext.jsx'
import StallRating from '../components/StallRating.jsx'
import { dishes, filters, stallId, stallName } from '../data/dishes.js'

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

function QuantityStepper({ quantity, onAdd, onRemove, dishName, maxQuantity }) {
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

export default function Order() {
  const [activeFilter, setActiveFilter] = useState(filters[0])
  const [viewMode, setViewMode] = useState('grid')
  const navigate = useNavigate()
  const { basket, addToBasket, removeFromBasket, basketEntries, itemCount, subtotal, maxQuantityPerDish } =
    useCart()

  const visibleDishes = useMemo(
    () => dishes.filter((dish) => dish.tags.includes(activeFilter)),
    [activeFilter],
  )

  return (
    <section id="order" className="flex w-full flex-col items-start bg-cream">
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row lg:gap-[30px] lg:px-12 lg:py-[34px]">
        <div className="flex flex-1 flex-col items-start gap-[22px]">
          <Reveal className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-[28px] font-extrabold text-ink sm:text-[34px]">What are you craving?</h2>
              <p className="text-sm text-muted">
                Dine-in at {stallName} • ready in 15–20 min
                <StallRating stallId={stallId} className="ml-2 font-semibold text-ink" />
              </p>
            </div>
            <div className="w-full rounded-full bg-surface px-[15px] py-[11px] sm:w-60">
              <input
                type="search"
                placeholder="⌕ Search dishes or stalls"
                className="w-full bg-transparent text-[13px] text-muted outline-none"
              />
            </div>
          </Reveal>

          <Reveal delay={100} className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-start gap-2.5">
              {filters.map((filter) => (
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
              <p className="text-sm font-bold text-ink">No dishes under "{activeFilter}" yet</p>
              <p className="text-xs text-muted">Try a different filter, or check back soon.</p>
            </Reveal>
          ) : viewMode === 'grid' ? (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDishes.map((dish, index) => (
                <Reveal
                  key={dish.menu_item_id}
                  delay={index * 100}
                  className="flex flex-col items-start gap-2.5 rounded-2xl bg-surface p-2.5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <img src={dish.image} alt={dish.name} className="h-[178px] w-full rounded-lg object-cover" />
                  <p className="text-[15px] font-bold text-ink">{dish.name}</p>
                  <p className="text-xs text-muted">{dish.subtitle}</p>
                  <div className="flex w-full items-center justify-between">
                    <p className="text-base font-extrabold text-ink">${dish.price.toFixed(2)}</p>
                    <QuantityStepper
                      quantity={basket[dish.menu_item_id] ?? 0}
                      onAdd={() => addToBasket(dish.menu_item_id)}
                      onRemove={() => removeFromBasket(dish.menu_item_id)}
                      dishName={dish.name}
                      maxQuantity={maxQuantityPerDish}
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
                  <img src={dish.image} alt={dish.name} className="size-[72px] shrink-0 rounded-lg object-cover" />
                  <div className="flex flex-1 flex-col items-start gap-0.5">
                    <p className="text-[15px] font-bold text-ink">{dish.name}</p>
                    <p className="text-xs text-muted">{dish.subtitle}</p>
                  </div>
                  <p className="text-base font-extrabold text-ink">${dish.price.toFixed(2)}</p>
                  <QuantityStepper
                    quantity={basket[dish.menu_item_id] ?? 0}
                    onAdd={() => addToBasket(dish.menu_item_id)}
                    onRemove={() => removeFromBasket(dish.menu_item_id)}
                    dishName={dish.name}
                    maxQuantity={maxQuantityPerDish}
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
          <p className="text-xs text-lime">{stallName.toUpperCase()}</p>

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
