import Button from '../components/Button.jsx'
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
        <Button variant="dark" to="contact">
          Partner with us
        </Button>
      </Reveal>
    </section>
  )
}
