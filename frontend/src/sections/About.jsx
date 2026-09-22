import Reveal from '../components/Reveal.jsx'
import hawkerCentre from '../assets/about-hawker-centre.png'

const impact = [
  { value: '32', label: 'hawker centres' },
  { value: '68%', label: 'family-run stalls' },
  { value: '11k', label: 'meals discovered' },
]

export default function About() {
  return (
    <section id="about" className="flex w-full flex-col items-start bg-surface">
      <div className="flex w-full flex-1 flex-col items-start gap-10 px-4 py-10 sm:px-8 lg:flex-row lg:gap-[58px] lg:px-16 lg:py-[52px]">
        <Reveal className="flex w-full flex-col items-start gap-[30px] lg:w-[500px] lg:shrink-0">
          <div className="flex w-full flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Our story</p>
            <h2 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">
              Keeping hawker culture close.
            </h2>
            <p className="text-base leading-[1.5] text-muted">
              HawkerAte connects a new generation of diners with the cooks, recipes and
              neighbourhoods that make Singapore taste like home.
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-3 rounded-3xl bg-forest p-6">
            <p className="text-xs font-bold text-lime">OUR MISSION</p>
            <p className="text-[23px] font-bold leading-[1.3] text-white">
              Make every heritage stall easier to find, support and remember.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-start justify-between gap-6 whitespace-nowrap">
            {impact.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 100} className="flex flex-col items-start gap-1">
                <p className="text-[28px] font-extrabold text-ink">{stat.value}</p>
                <p className="text-[13px] text-muted">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150} className="relative h-[300px] w-full overflow-hidden rounded-3xl sm:h-[400px] lg:h-full lg:flex-1">
          <img src={hawkerCentre} alt="Hawker centre" className="h-full w-full object-cover" />
          <div className="absolute bottom-[22px] left-[22px] rounded-2xl bg-surface p-3.5">
            <p className="text-[13px] font-semibold text-ink">
              Stories served one plate at a time.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
