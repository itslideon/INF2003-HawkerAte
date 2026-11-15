// The NEA hawker centre data has no region column, so the region is worked out from each centre's
// latitude and longitude: it is the nearest of five points spread across the island. This is an
// approximation for browsing the map, not an official NEA or URA region. Centres without
// coordinates have no region.
export const REGIONS = ['Central', 'North', 'South', 'West', 'East']

const ANCHORS = {
  Central: [1.31, 103.84],
  North: [1.37, 103.82],
  South: [1.275, 103.83],
  West: [1.34, 103.74],
  East: [1.335, 103.93],
}

export function regionOf(latitude, longitude) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (latitude == null || longitude == null || Number.isNaN(lat) || Number.isNaN(lon)) return null

  let best = null
  let bestDistance = Infinity
  for (const [name, [anchorLat, anchorLon]] of Object.entries(ANCHORS)) {
    const distance = (lat - anchorLat) ** 2 + (lon - anchorLon) ** 2
    if (distance < bestDistance) {
      best = name
      bestDistance = distance
    }
  }
  return best
}
