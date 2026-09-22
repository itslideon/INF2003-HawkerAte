import { createContext, useContext, useMemo, useState } from 'react'
import { dishes } from '../data/dishes.js'

const CartContext = createContext(null)
const MAX_QUANTITY_PER_DISH = 20

export function CartProvider({ children }) {
  const [basket, setBasket] = useState({ 'chicken-rice': 1 })

  const addToBasket = (menuItemId) => {
    setBasket((prev) => ({
      ...prev,
      [menuItemId]: Math.min((prev[menuItemId] ?? 0) + 1, MAX_QUANTITY_PER_DISH),
    }))
  }

  const removeFromBasket = (menuItemId) => {
    setBasket((prev) => {
      const current = prev[menuItemId] ?? 0
      if (current <= 1) {
        const { [menuItemId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [menuItemId]: current - 1 }
    })
  }

  const clearBasket = () => setBasket({})

  const basketEntries = useMemo(
    () =>
      Object.entries(basket)
        .filter(([, quantity]) => quantity > 0)
        .map(([menuItemId, quantity]) => ({
          dish: dishes.find((d) => d.menu_item_id === menuItemId),
          quantity,
        })),
    [basket],
  )

  const itemCount = basketEntries.reduce((sum, entry) => sum + entry.quantity, 0)
  const subtotal = basketEntries.reduce((sum, entry) => sum + entry.dish.price * entry.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        basket,
        addToBasket,
        removeFromBasket,
        clearBasket,
        basketEntries,
        itemCount,
        subtotal,
        maxQuantityPerDish: MAX_QUANTITY_PER_DISH,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
