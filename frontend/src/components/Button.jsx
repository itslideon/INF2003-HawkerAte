import arrowUpRight from '../assets/arrow-up-right.svg'
import arrowUpRightAlt from '../assets/arrow-up-right-alt.svg'

const variants = {
  lime: { classes: 'bg-lime text-ink hover:brightness-95', arrow: arrowUpRight },
  dark: { classes: 'bg-ink text-white hover:bg-ink/90', arrow: arrowUpRightAlt },
  light: { classes: 'bg-surface text-ink hover:bg-white', arrow: arrowUpRight },
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Button({ children, variant = 'lime', to, className = '', ...props }) {
  const { classes, arrow } = variants[variant]
  const sharedClassName = `inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:opacity-60 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${classes} ${className}`

  const content = (
    <>
      <span>{children}</span>
      <img src={arrow} alt="" className="size-[15px]" />
    </>
  )

  if (to) {
    return (
      <a
        href={`#${to}`}
        onClick={(event) => {
          event.preventDefault()
          scrollToSection(to)
        }}
        className={sharedClassName}
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <button type="button" className={sharedClassName} {...props}>
      {content}
    </button>
  )
}
