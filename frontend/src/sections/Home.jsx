import Button from '../components/Button.jsx'
import Reveal from '../components/Reveal.jsx'
import heroDish from '../assets/home-hero-dish.png'

const stats = [
  { value: '120+', label: 'curated stalls' },
  { value: '4.8/5', label: 'average rating' },
  { value: '18 min', label: 'average pickup' },
]

export default function Home() {
  return (
    <section id="home" className="flex w-full flex-col items-start bg-cream">
      <div className="flex w-full flex-col items-start gap-8 px-4 pb-8 pt-8 sm:px-8 sm:pt-10 lg:flex-row lg:gap-[46px] lg:px-12 lg:pb-[42px] lg:pl-16 lg:pt-[54px]">
        <Reveal className="flex w-full flex-col items-start gap-[22px] lg:w-[520px] lg:shrink-0">
          <div className="rounded-full bg-white px-3 py-[7px]">
            <p className="text-xs font-bold text-forest">● SINGAPORE'S HAWKER FAVOURITES</p>
          </div>
          <h1 className="text-[36px] font-extrabold leading-[1.05] text-ink sm:text-[46px] lg:text-[58px] lg:leading-[1.02]">
            Good food lives around the corner.
          </h1>
          <p className="max-w-[460px] text-[17px] leading-[1.55] text-muted">
            Discover legendary stalls, skip the queues, and bring Singapore's best-loved hawker
            dishes to your table.
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <Button variant="dark" to="order">
              Explore stalls
            </Button>
            <Button variant="light" to="insights">
              View popular spots
            </Button>
          </div>
        </Reveal>

        <Reveal
          delay={150}
          className="relative h-[280px] w-full overflow-hidden rounded-3xl drop-shadow-[0px_10px_14px_rgba(23,37,29,0.09)] sm:h-[360px] lg:h-full lg:flex-1"
        >
          <img src={heroDish} alt="Hawker dish spread" className="h-full w-full object-cover" />
          <div className="absolute bottom-6 left-6 flex flex-col gap-1 rounded-2xl bg-white p-4">
            <p className="text-base font-bold text-ink">Maxwell classics</p>
            <p className="text-xs text-muted">12 stalls • 20–30 min</p>
          </div>
        </Reveal>
      </div>

      <div className="flex w-full flex-1 flex-col items-start gap-6 bg-surface px-4 py-7 sm:px-8 lg:flex-row lg:items-start lg:justify-between lg:px-16">
        <div className="flex w-full flex-wrap items-start justify-between gap-6 lg:w-auto lg:justify-start lg:gap-10">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 100} className="flex flex-col items-start gap-1 whitespace-nowrap">
              <p className="text-[28px] font-extrabold text-ink">{stat.value}</p>
              <p className="text-[13px] text-muted">{stat.label}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300} className="w-full text-[17px] font-semibold leading-[1.45] text-forest lg:w-[370px]">
          "Made for people who plan their day around what to eat next."
        </Reveal>
      </div>
    </section>
  )
}
