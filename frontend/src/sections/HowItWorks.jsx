import Reveal from '../components/Reveal.jsx'

const steps = [
  {
    number: '01',
    title: 'Browse the stalls',
    description: "Explore hawker centres near you and see what's cooking right now.",
  },
  {
    number: '02',
    title: 'Order ahead',
    description: 'Build your basket and place your order before you even leave the house.',
  },
  {
    number: '03',
    title: 'Collect & dine in',
    description: 'Show your order ID at the counter and enjoy your meal at the hawker centre.',
  },
]

export default function HowItWorks() {
  return (
    <section className="flex w-full flex-col items-start gap-10 bg-cream px-4 py-10 sm:px-8 lg:px-16 lg:py-16">
      <Reveal className="flex flex-col items-start gap-2">
        <p className="text-xs font-bold uppercase text-coral">How it works</p>
        <h2 className="text-[26px] font-extrabold text-ink sm:text-[34px]">From craving to collection.</h2>
      </Reveal>
      <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:gap-8">
        {steps.map((step, index) => (
          <Reveal
            key={step.number}
            delay={index * 120}
            className="flex w-full flex-1 flex-col items-start gap-3 rounded-3xl bg-surface p-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="text-sm font-extrabold text-coral">{step.number}</p>
            <p className="text-xl font-extrabold text-ink">{step.title}</p>
            <p className="text-sm leading-[1.5] text-muted">{step.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
