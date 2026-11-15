// GET /stalls/:id/menu has no photo field. Each seeded dish name maps to one
// frontend asset so the Order grid never reuses a picture across different dishes.
import aglioOlio from '../assets/order-dish-aglio-olio.jpg'
import ayamPenyet from '../assets/order-dish-ayam-penyet.jpg'
import bandung from '../assets/order-dish-bandung.jpg'
import barley from '../assets/order-dish-barley.jpg'
import charKwayTeow from '../assets/order-dish-char-kway-teow.png'
import cheeseburger from '../assets/order-dish-cheeseburger.jpg'
import chickenBiryani from '../assets/order-dish-chicken-biryani.jpg'
import chickenChop from '../assets/order-dish-chicken-chop.jpg'
import chickenRice from '../assets/order-dish-chicken-rice.png'
import economicRice from '../assets/order-dish-economic-rice.jpg'
import fishAndChips from '../assets/order-dish-fish-and-chips.jpg'
import fishCurryRice from '../assets/order-dish-fish-curry-rice.jpg'
import fishHeadCurry from '../assets/order-dish-fish-head-curry.jpg'
import frenchFries from '../assets/order-dish-french-fries.jpg'
import friedRice from '../assets/order-dish-fried-rice.jpg'
import honeyLemon from '../assets/order-dish-honey-lemon.jpg'
import horFun from '../assets/order-dish-hor-fun.jpg'
import icedMilo from '../assets/order-dish-iced-milo.jpg'
import kopi from '../assets/order-dish-kopi.jpg'
import kopiC from '../assets/order-dish-kopi-c.jpg'
import laksa from '../assets/order-dish-laksa.png'
import lemonTea from '../assets/order-dish-lemon-tea.jpg'
import lontong from '../assets/order-dish-lontong.jpg'
import meeBandung from '../assets/order-dish-mee-bandung.jpg'
import meeGoreng from '../assets/order-dish-mee-goreng.jpg'
import meeRebus from '../assets/order-dish-mee-rebus.jpg'
import meeSiam from '../assets/order-dish-mee-siam.jpg'
import mixedGrill from '../assets/order-dish-mixed-grill.jpg'
import murtabak from '../assets/order-dish-murtabak.jpg'
import mushroomSoup from '../assets/order-dish-mushroom-soup.jpg'
import naanCurry from '../assets/order-dish-naan-curry.jpg'
import nasiKerabu from '../assets/order-dish-nasi-kerabu.jpg'
import nasiLemak from '../assets/order-dish-nasi-lemak.jpg'
import prata from '../assets/order-dish-prata.jpg'
import roastedMeatRice from '../assets/order-dish-roasted-meat-rice.jpg'
import satay from '../assets/order-dish-satay.jpg'
import softDrink from '../assets/order-dish-soft-drink.jpg'
import spaghetti from '../assets/order-dish-spaghetti.jpg'
import teh from '../assets/order-dish-teh.jpg'
import tehTarik from '../assets/order-dish-teh-tarik.jpg'
import thosai from '../assets/order-dish-thosai.jpg'
import wantonMee from '../assets/order-dish-wanton-mee.jpg'

// Keys are menu_item.name from etl/scripts/load_prices.py (lowercased).
const BY_NAME = {
  'hainanese chicken rice': chickenRice,
  'char kway teow': charKwayTeow,
  'wanton mee': wantonMee,
  'economic rice (3 dishes)': economicRice,
  'fried rice': friedRice,
  'hor fun': horFun,
  laksa,
  'roasted meat rice': roastedMeatRice,
  kopi,
  'nasi lemak': nasiLemak,
  'mee rebus': meeRebus,
  'satay (10 sticks)': satay,
  'mee siam': meeSiam,
  'ayam penyet': ayamPenyet,
  lontong,
  'mee bandung': meeBandung,
  'nasi kerabu': nasiKerabu,
  teh,
  'prata (2 pieces)': prata,
  'chicken biryani': chickenBiryani,
  'fish head curry (small)': fishHeadCurry,
  'mee goreng': meeGoreng,
  thosai,
  murtabak,
  'fish curry rice': fishCurryRice,
  'naan with curry': naanCurry,
  'teh tarik': tehTarik,
  'fish and chips': fishAndChips,
  'chicken chop': chickenChop,
  spaghetti,
  'mixed grill': mixedGrill,
  cheeseburger,
  'aglio olio': aglioOlio,
  'french fries': frenchFries,
  'mushroom soup': mushroomSoup,
  'soft drink': softDrink,
  'kopi c': kopiC,
  'iced milo': icedMilo,
  bandung,
  barley,
  'lemon tea': lemonTea,
  'honey lemon': honeyLemon,
}

export function dishPhoto(name = '') {
  return BY_NAME[String(name).trim().toLowerCase()] ?? null
}
