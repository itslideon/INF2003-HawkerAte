// The menu API has no dish photos (GET /stalls/:id/menu sends name, price, availability only), so
// each dish gets a food emoji chosen from words in its name. It is a rough visual cue, not a
// picture of the dish: anything we don't recognise keeps the plain plate. The first matching
// rule wins, so more specific words go first.
const RULES = [
  [/\b(laksa|mee|noodles?|kway teow|kuay teow|bee hoon|bihun|hor fun|ho fun|ramen|udon|pho|mee goreng|mee rebus|mee siam|mee pok|wanton mee)\b/, '🍜'],
  [/\b(dumplings?|wanton|wonton|gyoza|siew mai|har gow|bao)\b/, '🥟'],
  [/\b(satay|skewers?)\b/, '🍢'],
  [/\b(prata|roti|naan|thosai|dosai|murtabak|pancake)\b/, '🫓'],
  [/\b(curry|rendang|lontong|masala|dhal|dal)\b/, '🍛'],
  [/\b(soup|bak kut teh|congee|porridge|bubur)\b/, '🥣'],
  [/\b(fish|stingray|sotong|squid|crab|chilli crab)\b/, '🐟'],
  [/\b(prawns?|shrimp|hae mee)\b/, '🍤'],
  [/\b(chicken|ayam|duck|goose|wings?)\b/, '🍗'],
  [/\b(beef|steak|mutton|lamb)\b/, '🥩'],
  [/\b(rice|nasi|biryani|briyani|claypot|congee|chye tow kway|carrot cake)\b/, '🍚'],
  [/\b(egg|telur)\b/, '🥚'],
  [/\b(salad|rojak|gado|vegetables?|kangkong|tofu|tauhu|tempeh)\b/, '🥗'],
  [/\b(kopi|coffee|teh|tea|milo|latte)\b/, '☕'],
  [/\b(juice|sugar cane|soya|soy milk|lime|drink|bandung|barley|honey|lemon|sirap|cola|coke|sprite|soda)\b/, '🧃'],
  [/\b(cendol|ice kacang|ais|dessert|kueh|kuih|pudding|ice cream|ice)\b/, '🍧'],
]

export function dishEmoji(name = '') {
  const text = String(name).toLowerCase()
  for (const [pattern, emoji] of RULES) {
    if (pattern.test(text)) return emoji
  }
  return '🍽️'
}
