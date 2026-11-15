import Navigation from '../components/Navigation.jsx'
import Reveal from '../components/Reveal.jsx'
import CentreMap, { RegionChips } from '../components/CentreMap.jsx'

export default function MapPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-cream">
      <Navigation />
      <div className="flex w-full flex-1 flex-col items-start gap-6 px-4 py-8 sm:px-8 lg:px-16 lg:py-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-2">
          <p className="text-xs font-bold uppercase text-coral">Map</p>
          <h1 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">
            Hawker centres across Singapore
          </h1>
          <p className="max-w-[640px] text-base leading-[1.5] text-muted">
            Tap a pin to see the centre, then order from it.
          </p>
        </Reveal>
        <RegionChips />
        <CentreMap showChips={false} />
      </div>
    </div>
  )
}
