import { useState } from 'react'
import Button from '../components/Button.jsx'
import Reveal from '../components/Reveal.jsx'

function FormField({ label, ...props }) {
  return (
    <label className="flex h-[58px] flex-1 flex-col items-start gap-1 rounded-lg border border-border px-4 py-[11px] transition-colors focus-within:border-forest">
      <span className="text-[11px] font-bold text-muted">{label}</span>
      <input className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted" {...props} />
    </label>
  )
}

export default function Contact() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' })

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const submitForm = (event) => {
    event.preventDefault()
  }

  return (
    <section id="contact" className="flex w-full flex-col items-start bg-cream">
      <div className="flex w-full flex-1 flex-col items-start gap-10 px-4 py-10 sm:px-8 lg:flex-row lg:gap-[74px] lg:px-16 lg:py-12">
        <Reveal className="flex w-full flex-col items-start gap-7 lg:w-[430px] lg:shrink-0">
          <div className="flex w-full flex-col items-start gap-3">
            <p className="text-xs font-bold uppercase text-coral">Talk to us</p>
            <h2 className="text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[46px] sm:leading-[1.05]">Let's share a table.</h2>
            <p className="text-base leading-[1.5] text-muted">
              Questions about an order, a stall recommendation, or bringing your business onto
              HawkerAte? We'd love to hear from you.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4">
            <p className="text-base font-bold text-ink">hello@hawkerate.sg</p>
            <p className="text-base font-bold text-ink">+65 6123 4567</p>
            <div className="text-sm leading-[1.5] text-muted">
              <p>Daily, 9:00 am–9:00 pm</p>
              <p>Tanjong Pagar, Singapore</p>
            </div>
          </div>
        </Reveal>

        <Reveal
          delay={150}
          as="form"
          className="flex w-full flex-1 flex-col items-start gap-4 rounded-3xl bg-surface p-5 sm:p-[30px]"
          onSubmit={submitForm}
        >
          <p className="text-[22px] font-extrabold text-ink">Send us a note</p>
          <div className="flex w-full flex-col items-start gap-3.5 sm:flex-row">
            <FormField
              label="FIRST NAME"
              placeholder="Jamie"
              value={form.firstName}
              onChange={updateField('firstName')}
            />
            <FormField
              label="LAST NAME"
              placeholder="Tan"
              value={form.lastName}
              onChange={updateField('lastName')}
            />
          </div>
          <FormField
            label="EMAIL"
            type="email"
            placeholder="jamie@example.com"
            value={form.email}
            onChange={updateField('email')}
          />
          <label className="flex h-[110px] w-full flex-col items-start gap-1 rounded-lg border border-border px-4 py-[11px] transition-colors focus-within:border-forest">
            <span className="text-[11px] font-bold text-muted">MESSAGE</span>
            <textarea
              className="w-full flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              placeholder="Tell us what's on your mind…"
              value={form.message}
              onChange={updateField('message')}
            />
          </label>
          <Button variant="lime">Send message</Button>
        </Reveal>
      </div>
    </section>
  )
}
