import Reveal from '../components/Reveal.jsx'

const stats = [
  { value: '2,300+', label: 'orders served today' },
  { value: '48', label: 'hawker stalls online' },
  { value: '9 min', label: 'average wait, order-ahead' },
]

export default function LiveStats() {
  return (
    <section className="flex w-full flex-col items-start gap-8 bg-ink px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-14">
      <div className="flex w-full flex-wrap items-start gap-8 lg:w-auto">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 100} className="flex flex-col items-start gap-1">
            <p className="text-[32px] font-extrabold text-lime">{stat.value}</p>
            <p className="text-sm text-white/70">{stat.label}</p>
          </Reveal>
        ))}
      </div>
      <Reveal delay={300} className="max-w-[320px] text-sm leading-[1.6] text-white/70">
        Numbers update throughout the day as stalls come online and orders roll in.
      </Reveal>
    </section>
  )
}
