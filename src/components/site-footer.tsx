import * as React from 'react'
import Link from 'next/link'
import { Cross, RadioTower, Search } from 'lucide-react'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { CATEGORIES, categoryMeta, channels, siteInfo } from '@/lib/content'

const channelIcons = {
  radio: RadioTower,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
} as const

/* Brand hover colors so each channel reads instantly. */
const channelHover: Record<string, string> = {
  radio: 'hover:border-gold/60 hover:text-gold',
  youtube: 'hover:border-[#FF0000]/60 hover:text-[#FF3333]',
  whatsapp: 'hover:border-[#25D366]/60 hover:text-[#25D366]',
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-navy-900/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* ── Brand + mission ────────────────────────────────── */}
          <div className="md:col-span-5">
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
          </div>

          {/* ── Sections ───────────────────────────────────────── */}
          <nav className="md:col-span-3" aria-label="Sections">
            <p className="kicker text-ink-subtle">The desk</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/articles" className="font-sans text-sm text-ink-muted transition-colors hover:text-gold">
                  All articles
                </Link>
              </li>
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    href={`/category/${categoryMeta[category].slug}`}
                    className="font-sans text-sm text-ink-muted transition-colors hover:text-gold"
                  >
                    {category}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="font-sans text-sm text-ink-muted transition-colors hover:text-gold">
                  About the ministry
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-muted transition-colors hover:text-gold"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search the archive
                </Link>
              </li>
            </ul>
          </nav>

          {/* ── Connect ────────────────────────────────────────── */}
          <div className="md:col-span-4">
            <p className="kicker text-ink-subtle">Connect</p>
            <ul className="mt-4 space-y-3">
              {channels.map((channel) => {
                const Icon = channelIcons[channel.key]
                return (
                  <li key={channel.key}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`focus-ring group flex items-start gap-3 rounded-xl border border-hairline p-3 text-ink-muted transition-colors ${channelHover[channel.key]}`}
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-hairline bg-surface-2">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
                          {channel.name}
                          {channel.live && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger/30 bg-status-danger/10 px-2 py-0.5 font-sans text-[0.5625rem] font-bold uppercase tracking-kicker text-status-danger">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-danger" />
                              </span>
                              On air
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block font-serif text-xs leading-relaxed text-ink-subtle">
                          {channel.tagline}
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="double-rule mt-12 pt-5">
          <p className="text-center font-sans text-xs text-ink-subtle">
            © {new Date().getFullYear()} {siteInfo.name} · {siteInfo.ministry} ·{' '}
            <span className="text-gold">Soli Deo Gloria</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
