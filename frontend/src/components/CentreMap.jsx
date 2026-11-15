import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import StatusNotice from './StatusNotice.jsx'
import { useMenu } from '../context/MenuContext.jsx'
import { REGIONS, regionOf } from '../lib/region.js'

const SINGAPORE = [1.3521, 103.8198]
const hasPoint = (centre) =>
  centre.latitude != null && centre.longitude != null && !Number.isNaN(Number(centre.latitude)) && !Number.isNaN(Number(centre.longitude))

// Central / North / South / West / East buttons. The choice lives in MenuContext, so it also
// narrows the centre dropdown in the Order section.
export function RegionChips() {
  const { centres, region, setRegion } = useMenu()
  const allPlaced = centres.filter(hasPoint)
  if (allPlaced.length === 0) return null
  const count = (name) =>
    name === 'All' ? allPlaced.length : allPlaced.filter((c) => regionOf(c.latitude, c.longitude) === name).length

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <p className="text-[11px] font-bold uppercase text-muted">Region</p>
      <div className="flex flex-wrap gap-2">
        {['All', ...REGIONS].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setRegion(name)}
            aria-pressed={region === name}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-60 ${
              region === name ? 'bg-forest text-white' : 'bg-cream text-ink'
            }`}
          >
            {name}
            <span className="font-normal opacity-70"> ({count(name)})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Map of every hawker centre that has coordinates (GET /centres, loaded from the NEA GeoJSON).
// Pins use the real latitude and longitude. Centres without coordinates cannot be placed, so
// they are listed under the map instead of being hidden. The pale base map (Esri Light Gray
// Canvas) needs internet; the pins and list do not.
export default function CentreMap({ showChips = true, showUnplaced = true, mapClassName = 'h-[460px] sm:h-[560px]' }) {
  const { status, centres, centre: selected, selectCentre, region } = useMenu()
  const navigate = useNavigate()
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const selectRef = useRef(null)

  const allPlaced = centres.filter(hasPoint)
  const placed = region === 'All' ? allPlaced : allPlaced.filter((c) => regionOf(c.latitude, c.longitude) === region)
  const unplaced = centres.filter((c) => !hasPoint(c))

  // keep the latest handlers without rebuilding the map
  selectRef.current = (centreId) => {
    selectCentre(centreId)
    navigate('/', { state: { scrollTo: 'order' } })
  }

  useEffect(() => {
    if (!mapNode.current || placed.length === 0) return undefined

    const map = L.map(mapNode.current, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView(SINGAPORE, 11)
    mapRef.current = map
    // Esri "Light Gray Canvas": pale base map with few roads, so the pins stand out.
    // The reference layer adds the place names on top. No API key needed.
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
    L.tileLayer(`${esri}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri, DeLorme, NAVTEQ',
    }).addTo(map)
    L.tileLayer(`${esri}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(map)

    const points = []
    for (const c of placed) {
      const point = [Number(c.latitude), Number(c.longitude)]
      points.push(point)
      const isSelected = c.centre_id === selected?.centre_id
      const marker = L.circleMarker(point, {
        radius: isSelected ? 9 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: isSelected ? '#2f4a3a' : '#e0654a',
        fillOpacity: 0.95,
      }).addTo(map)

      const box = document.createElement('div')
      const title = document.createElement('p')
      title.textContent = c.name
      title.style.cssText = 'font-weight:700;margin:0 0 2px'
      const address = document.createElement('p')
      address.textContent = c.address || 'Address not listed'
      address.style.cssText = 'margin:0 0 8px;font-size:12px'
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = 'Order from here'
      button.style.cssText =
        'background:#17251d;color:#fff;border:0;border-radius:999px;padding:6px 12px;font-weight:700;font-size:12px;cursor:pointer'
      button.addEventListener('click', () => selectRef.current(c.centre_id))
      box.append(title, address, button)
      marker.bindPopup(box)
      marker.bindTooltip(c.name)
    }

    if (points.length > 1) map.fitBounds(points, { padding: [30, 30], animate: false })
    else if (points.length === 1) map.setView(points[0], 15, { animate: false })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // the map is rebuilt when the list of centres or the selected centre changes
  }, [placed.length, region, selected?.centre_id]) // eslint-disable-line react-hooks/exhaustive-deps

  let body
  if (status === 'loading') {
    body = <StatusNotice title="Loading the centres…" />
  } else if (centres.length === 0) {
    body = (
      <StatusNotice
        title="No centres to show"
        text="Can't load the centres. Make sure backend/app.py is running and the centre data is loaded."
      />
    )
  } else {
    body = (
      <div className="flex w-full flex-col gap-4">
        {showChips && <RegionChips />}
        {placed.length === 0 ? (
          <StatusNotice
            title={allPlaced.length === 0 ? 'No coordinates loaded yet' : `No centres in the ${region} region`}
            text={allPlaced.length === 0 ? 'None of the centres has a latitude and longitude.' : 'Try another region.'}
          />
        ) : (
          <div
            ref={mapNode}
            role="region"
            aria-label="Map of hawker centres"
            className={`w-full overflow-hidden rounded-2xl border border-border ${mapClassName}`}
          />
        )}
        <p className="max-w-[640px] text-xs leading-[1.5] text-muted">
          Showing {placed.length} of {centres.length} centres. The dark pin is your centre. Regions are approximate, as the
          NEA data has no region field.
        </p>

        {showUnplaced && region === 'All' && unplaced.length > 0 && (
          <div className="flex w-full flex-col items-start gap-2 rounded-2xl bg-surface p-5">
            <p className="text-sm font-bold text-ink">Not on the map ({unplaced.length})</p>
            <p className="text-xs text-muted">These have no coordinates in the NEA data. You can still order from them.</p>
            <div className="flex flex-wrap gap-2">
              {unplaced.map((c) => (
                <button
                  key={c.centre_id}
                  type="button"
                  onClick={() => selectRef.current(c.centre_id)}
                  className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink transition-opacity duration-200 hover:opacity-60"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return body
}
