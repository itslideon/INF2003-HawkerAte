import Reveal from '../components/Reveal.jsx'
import mapTexture from '../assets/insights-map-texture.png'
import heatSpot1 from '../assets/heat-spot-1.svg'
import heatSpot2 from '../assets/heat-spot-2.svg'
import heatSpot3 from '../assets/heat-spot-3.svg'
import heatSpot4 from '../assets/heat-spot-4.svg'
import heatSpot5 from '../assets/heat-spot-5.svg'
import indicatorDot from '../assets/indicator-dot.svg'

const metrics = [
  { label: 'Total visits', value: '14.8k', change: '+12%' },
  { label: 'Peak hour', value: '12:30 pm', change: 'Lunch' },
  { label: 'Top location', value: 'Maxwell', change: '2.4k' },
  { label: 'Trending dish', value: 'Laksa', change: '+28%' },
]

const heatSpots = [
  { src: heatSpot1, top: 225, left: 170, size: 90, delay: 0 },
  { src: heatSpot2, top: 140, left: 360, size: 65, delay: 300 },
  { src: heatSpot3, top: 255, left: 520, size: 54, delay: 600 },
  { src: heatSpot4, top: 110, left: 640, size: 38, delay: 900 },
  { src: heatSpot5, top: 330, left: 450, size: 32, delay: 1200 },
]

const places = [
  { rank: '01', name: 'Maxwell Food Centre', visits: '2.4k visits', share: '92%', barColor: 'bg-coral', width: '88%' },
  { rank: '02', name: 'Old Airport Road', visits: '1.9k visits', share: '74%', barColor: 'bg-amber', width: '71%' },
  { rank: '03', name: 'Lau Pa Sat', visits: '1.6k visits', share: '63%', barColor: 'bg-amber', width: '61%' },
]

export default function Insights() {
  return (
    <section id="insights" className="flex w-full flex-col items-start bg-cream">
      <div className="flex w-full flex-col items-start gap-5 px-4 pb-9 pt-7 sm:px-8 lg:px-12">
        <Reveal className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-1">
            <p className="text-xs font-bold text-coral">LIVE DINING PULSE</p>
            <h2 className="text-[26px] font-extrabold text-ink sm:text-[34px]">Where Singapore is eating</h2>
          </div>
          <button
            type="button"
            className="rounded-full bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink transition-opacity duration-200 hover:opacity-60"
          >
            This week ⌄
          </button>
        </Reveal>

        <div className="grid w-full grid-cols-2 gap-3.5 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Reveal
              key={metric.label}
              delay={index * 100}
              className="flex flex-col items-start gap-1.5 rounded-2xl bg-surface p-4 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="text-[11px] font-bold text-muted">{metric.label}</p>
              <p className="text-[22px] font-extrabold text-ink">{metric.value}</p>
              <p className="text-[11px] font-semibold text-success">{metric.change}</p>
            </Reveal>
          ))}
        </div>

        <div className="flex w-full flex-col items-start gap-[18px] lg:h-[439px] lg:flex-row">
          <Reveal
            delay={150}
            className="relative h-[300px] w-full overflow-hidden rounded-3xl bg-forest-dark sm:h-[380px] lg:h-full lg:flex-1"
          >
            <img src={mapTexture} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
            {heatSpots.map((spot, index) => (
              <img
                key={index}
                src={spot.src}
                alt=""
                className="absolute animate-pulse-glow"
                style={{ top: spot.top, left: spot.left, width: spot.size, height: spot.size, animationDelay: `${spot.delay}ms` }}
              />
            ))}
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-surface px-[13px] py-[9px]">
              <img src={indicatorDot} alt="" className="size-[9px] animate-pulse" />
              <p className="text-[11px] font-bold text-ink">BUSIER NOW</p>
            </div>
            <div className="absolute left-[145px] top-[310px] flex flex-col items-start gap-0.5 rounded-lg bg-surface p-3">
              <p className="text-[13px] font-extrabold text-ink">Maxwell Food Centre</p>
              <p className="text-[11px] text-coral">Very popular · 92%</p>
            </div>
          </Reveal>

          <Reveal
            delay={250}
            className="flex w-full flex-col items-start gap-[18px] rounded-3xl bg-surface p-[22px] lg:h-full lg:w-[330px] lg:shrink-0"
          >
            <p className="text-xl font-extrabold text-ink">Popular places</p>
            {places.map((place) => (
              <div key={place.rank} className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full items-start gap-2.5">
                  <p className="w-5 text-[13px] font-extrabold text-coral">{place.rank}</p>
                  <div className="flex flex-1 flex-col items-start gap-0.5">
                    <p className="text-sm font-bold text-ink">{place.name}</p>
                    <p className="text-[11px] text-muted">{place.visits}</p>
                  </div>
                  <p className="text-xs font-bold text-success">{place.share}</p>
                </div>
                <div className="h-[5px] w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-[5px] rounded-full transition-all duration-1000 ease-out ${place.barColor}`}
                    style={{ width: place.width }}
                  />
                </div>
              </div>
            ))}

            <div className="flex w-full flex-col items-start gap-1 rounded-lg bg-cream p-3.5">
              <p className="text-[10px] font-bold text-coral">BEST TIME TO VISIT</p>
              <p className="text-[13px] leading-[1.4] text-ink">
                Try Maxwell before 11:45 am for shorter queues.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
