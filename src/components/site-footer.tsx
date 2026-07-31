import * as React from 'react'
import { Cross, Facebook, Instagram, Podcast, Youtube } from 'lucide-react'
import { siteInfo } from '@/lib/content'

const socials = [
  { label: 'YouTube', icon: Youtube },
  { label: 'Instagram', icon: Instagram },
  { label: 'Facebook', icon: Facebook },
  { label: 'Podcast', icon: Podcast },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-navy-900/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-gold/10">
            <Cross className="h-4 w-4 text-gold" strokeWidth={1.5} />
          </span>
          <p className="mt-4 font-display text-2xl font-bold text-ink-strong">{siteInfo.name}</p>
          <p className="mt-3 max-w-md font-serif text-sm leading-relaxed text-ink-muted">
            {siteInfo.mission}
          </p>
          <p className="mt-5 max-w-md font-serif text-sm italic leading-relaxed text-ink-subtle">
            “Your word is a lamp to my feet and a light to my path.”
          </p>
          <p className="kicker mt-1 text-gold">Psalm 119:105</p>

          <div className="mt-7 flex items-center gap-2">
            {socials.map(({ label, icon: Icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-hairline text-ink-subtle transition-colors hover:border-gold/50 hover:text-gold"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="double-rule mt-10 pt-5">
          <p className="text-center font-sans text-xs text-ink-subtle">
            © {new Date().getFullYear()} {siteInfo.name}. All rights reserved. ·{' '}
            <span className="text-gold">Soli Deo Gloria</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
