import * as React from 'react'
import { pastoralCare } from '@/lib/content'

/**
 * The way to reach a person, at the foot of every reader page.
 *
 * The site publishes on repentance, suffering and readiness — subjects a
 * reader does not always finish reading as a reader. Every one of those
 * pages ended at a footer of links, which is the wrong last thing for
 * someone who has just decided to ask for help, so this stands between
 * the page and the footer: what to call, what to write to, and where the
 * altar is.
 *
 * It speaks in the ministry's own voice rather than the page's, and it is
 * coloured to say so: cream and navy ink on paper, the plate in the dark
 * theme. It used to be the plate in both, which meant a reader who chose
 * the light theme got a band that stayed dark at the foot of every page.
 * Keeping a voice of its own and keeping one colour in both themes turned
 * out to be different things — the `care` set in globals.css is the first,
 * without the second.
 */
export function PastoralCare() {
  return (
    <section
      aria-labelledby="pastoral-care"
      className="border-t border-care-rule bg-care"
    >
      <div className="shell relative isolate overflow-hidden py-14 sm:py-16">
        <p className="kicker mb-4 text-care-mark">{pastoralCare.kicker}</p>
        <h2
          id="pastoral-care"
          className="font-display text-[1.75rem] font-medium leading-[1.1] text-care-head sm:text-[2.125rem]"
        >
          {pastoralCare.title}
        </h2>
        <span aria-hidden className="mt-5 block h-[3px] w-14 rounded-full bg-gold" />

        <p className="mt-6 max-w-[46ch] text-pretty text-[1.0625rem] leading-[1.6] text-care-body">
          {pastoralCare.body}
        </p>

        <p className="mt-6 flex items-start gap-2.5 font-mono text-[0.75rem] uppercase leading-[1.5] tracking-[0.08em] text-care-body">
          <PinIcon />
          {pastoralCare.office}
        </p>

        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastoralCare.lines.map((line) => (
            <li
              key={line.kind}
              className="flex items-center gap-4 rounded-panel border border-care-rule bg-care-tile px-5 py-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/[0.14] text-care-mark">
                <LineIcon kind={line.kind} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-care-head">{line.label}</span>
                {line.contacts.map((contact) => (
                  <a
                    key={contact.href}
                    href={contact.href}
                    /* A phone number is not a page: it opens the dialer, and
                       on a desktop it is still the thing to copy. */
                    className="focus-ring block truncate font-mono text-[0.8125rem] text-care-mark underline-offset-4 transition-colors hover:text-gold hover:underline"
                  >
                    {contact.text}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PinIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[3px] shrink-0 text-care-mark"
    >
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

function LineIcon({ kind }: { kind: 'phone' | 'whatsapp' | 'email' }) {
  const shared = {
    'aria-hidden': true,
    viewBox: '0 0 24 24',
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (kind === 'phone') {
    return (
      <svg {...shared}>
        <path d="M6.2 3.8h3l1.5 3.7-2 1.4a11.6 11.6 0 0 0 5.4 5.4l1.4-2 3.7 1.5v3a1.7 1.7 0 0 1-1.9 1.7A15.8 15.8 0 0 1 4.5 5.7a1.7 1.7 0 0 1 1.7-1.9Z" />
      </svg>
    )
  }
  if (kind === 'whatsapp') {
    return (
      <svg {...shared}>
        <path d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.6Z" />
        <path d="M9 9.6c.4 2.4 2.2 4.2 4.6 4.6" />
      </svg>
    )
  }
  return (
    <svg {...shared}>
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2" />
      <path d="m3.8 7 8.2 5.6L20.2 7" />
    </svg>
  )
}
