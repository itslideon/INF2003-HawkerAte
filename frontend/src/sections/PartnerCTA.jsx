import { Link } from 'react-router-dom'
import arrowUpRightAlt from '../assets/arrow-up-right-alt.svg'
import Reveal from '../components/Reveal.jsx'

export default function PartnerCTA() {
  return (
    <section className="flex w-full flex-col items-start gap-6 bg-lime px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-14">
      <Reveal className="flex max-w-[520px] flex-col items-start gap-2">
        <p className="text-xs font-bold uppercase text-forest">For stall owners</p>
        <h2 className="text-[24px] font-extrabold leading-[1.15] text-ink sm:text-[30px] sm:leading-[1.1]">
          Bring your stall to a new generation of regulars.
        </h2>
      </Reveal>
      <Reveal delay={150}>
        <Link
          to="/owner"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold whitespace-nowrap text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink/90 hover:opacity-60 hover:shadow-md active:translate-y-0"
        >
          <span>See today’s takings</span>
          <img src={arrowUpRightAlt} alt="" className="size-[15px]" />
        </Link>
      </Reveal>
    </section>
  )
}
