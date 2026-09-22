import Reveal from '../components/Reveal.jsx'

const testimonials = [
  {
    quote: "HawkerAte introduced me to stalls I would've walked right past. Now it's my go-to for lunch.",
    name: 'Wei Jie',
    detail: 'Tanjong Pagar',
  },
  {
    quote: 'Ordering ahead means no more standing in the Maxwell queue during my lunch break.',
    name: 'Priya',
    detail: 'Raffles Place',
  },
  {
    quote: 'As a hawker, this app brought a whole new generation of regulars to my stall.',
    name: 'Uncle Tan',
    detail: 'Chinatown Complex',
  },
]

export default function Testimonials() {
  return (
    <section className="flex w-full flex-col items-start gap-10 bg-forest px-4 py-10 sm:px-8 lg:px-16 lg:py-16">
      <Reveal className="flex flex-col items-start gap-2">
        <p className="text-xs font-bold uppercase text-lime">What people say</p>
        <h2 className="text-[26px] font-extrabold text-white sm:text-[34px]">Loved by regulars and stall owners alike.</h2>
      </Reveal>
      <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:gap-6">
        {testimonials.map((testimonial, index) => (
          <Reveal
            key={testimonial.name}
            delay={index * 120}
            className="flex w-full flex-1 flex-col items-start gap-4 rounded-3xl bg-white/10 p-7"
          >
            <p className="text-base leading-[1.6] text-white">"{testimonial.quote}"</p>
            <div>
              <p className="text-sm font-bold text-lime">{testimonial.name}</p>
              <p className="text-xs text-white/60">{testimonial.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
