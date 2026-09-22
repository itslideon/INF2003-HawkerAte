import chickenRice from '../assets/order-dish-chicken-rice.png'
import laksa from '../assets/order-dish-laksa.png'
import charKwayTeow from '../assets/order-dish-char-kway-teow.png'

// matches Lideon's PK/FK naming (centre_id -> stall_id -> menu_item_id) for later
export const centreId = 'centre-maxwell'
export const stallId = 'stall-maxwell-01'
export const stallName = 'Maxwell Food Centre'

export const filters = ['Popular', 'Chicken rice', 'Noodles', 'Halal', 'Under $10']

export const dishes = [
  {
    menu_item_id: 'chicken-rice',
    stall_id: stallId,
    name: 'Hainanese Chicken Rice',
    subtitle: 'Heritage favourite',
    price: 6.8,
    image: chickenRice,
    tags: ['Popular', 'Chicken rice', 'Halal', 'Under $10'],
  },
  {
    menu_item_id: 'laksa',
    stall_id: stallId,
    name: 'Katong Laksa',
    subtitle: 'Heritage favourite',
    price: 7.5,
    image: laksa,
    tags: ['Popular', 'Noodles', 'Under $10'],
  },
  {
    menu_item_id: 'char-kway-teow',
    stall_id: stallId,
    name: 'Char Kway Teow',
    subtitle: 'Heritage favourite',
    price: 8.2,
    image: charKwayTeow,
    tags: ['Noodles', 'Under $10'],
  },
]
