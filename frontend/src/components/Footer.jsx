import brandMark from '../assets/brand-mark.svg'

const exploreLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'order', label: 'Order' },
  { id: 'insights', label: 'Insights' },
]

function scrollToSection(event, id) {
  event.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Footer() {
  return (
    <footer className="flex w-full flex-col items-start gap-10 bg-ink px-4 py-12 sm:px-8 lg:px-16">
      <div className="flex w-full flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex max-w-[320px] flex-col items-start gap-3">
          <div className="flex items-center gap-2.5">
            <img src={brandMark} alt="" className="size-8" />
            <span className="text-lg font-extrabold text-white">HawkerAte</span>
          </div>
          <p className="text-sm leading-[1.6] text-white/60">
            Helping Singapore's hawker stalls find their next regular, one plate at a time.
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-white/40">Explore</p>
            {exploreLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => scrollToSection(event, link.id)}
                className="text-sm text-white/70 transition-opacity duration-200 hover:opacity-60"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-white/40">Get in touch</p>
            <a
              href="mailto:hello@hawkerate.sg"
              className="text-sm text-white/70 transition-opacity duration-200 hover:opacity-60"
            >
              hello@hawkerate.sg
            </a>
            <a
              href="tel:+6561234567"
              className="text-sm text-white/70 transition-opacity duration-200 hover:opacity-60"
            >
              +65 6123 4567
            </a>
            <a
              href="#contact"
              onClick={(event) => scrollToSection(event, 'contact')}
              className="text-sm text-white/70 transition-opacity duration-200 hover:opacity-60"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} HawkerAte. Made for Singapore's hawker centres.</p>
      </div>
    </footer>
  )
}
