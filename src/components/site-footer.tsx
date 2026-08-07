import * as React from 'react'
import Link from 'next/link'
import { RadioTower, Search } from 'lucide-react'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { channels, siteInfo } from '@/lib/content'

const channelIcons = {
  radio: RadioTower,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
} as const

/* Brand hover colors so each channel reads instantly. */
const channelHover: Record<string, string> = {
  radio: 'hover:text-gold',
  youtube: 'hover:text-[#FF6B6B]',
  whatsapp: 'hover:text-[#25D366]',
}

/**
 * The footer closes the page the way the reference does: a centred epigraph
 * on navy, three columns of links beneath it, and a hairline base bar. It
 * collapses 3 → 2 → 1 column as the viewport narrows.
 */
export function SiteFooter() {
  return (
    <footer className="on-navy bg-navy text-sky">
      {/* ── Epigraph ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-shell px-5 pt-14 text-center sm:px-6">
        <p className="mx-auto mb-3 max-w-lg font-display text-lg font-light italic leading-snug text-linen sm:text-xl">
          And thou shalt make holy garments for Aaron thy brother for glory and for beauty.
        </p>
        <cite className="font-sans text-[0.625rem] font-medium uppercase not-italic tracking-[0.2em] text-gold">
          Exodus 28:2
        </cite>
      </div>

      {/* ── Columns ──────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-shell grid-cols-1 gap-9 px-5 pb-8 pt-14 sm:px-6 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr] md:gap-12">
        <div className="sm:col-span-2 md:col-span-1">
          <p className="mb-4 font-display text-xl text-linen sm:text-[1.3rem]">{siteInfo.name}</p>
          <p className="mb-4 max-w-md text-[0.95rem] leading-relaxed">{siteInfo.mission}</p>
          <p className="text-[0.95rem] leading-relaxed">Nyeri, Kenya</p>
        </div>

        <nav aria-label="Read">
          <h2 className="kicker mb-4 font-semibold text-linen">Read</h2>
          <ul className="space-y-2.5">
            <li>
              <Link href="/" className="font-sans text-sm transition-colors hover:text-linen">
                All articles
              </Link>
            </li>
            <li>
              <Link href="/teachings" className="font-sans text-sm transition-colors hover:text-linen">
                Teachings
              </Link>
            </li>
            <li>
              <Link href="/prophecies" className="font-sans text-sm transition-colors hover:text-linen">
                Prophecies
              </Link>
            </li>
            <li>
              <Link href="/about" className="font-sans text-sm transition-colors hover:text-linen">
                About
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 font-sans text-sm transition-colors hover:text-linen"
              >
                <Search className="h-3.5 w-3.5" />
                Search the archive
              </Link>
            </li>
          </ul>
        </nav>

        {/* The official channels. The menu no longer carries them, so this
            is where a reader finds the radio, the videos, and the share
            link — they are given room accordingly. */}
        <nav aria-label="Channels" className="sm:col-span-2 md:col-span-1">
          <h2 className="kicker mb-4 font-semibold text-linen">Listen &amp; watch</h2>
          <ul className="space-y-2">
            {channels.map((channel) => {
              const Icon = channelIcons[channel.key]
              return (
                <li key={channel.key}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`focus-ring group flex items-center gap-3 rounded-sm border border-white/10 px-3 py-2.5 transition-colors hover:border-white/25 hover:bg-white/5 ${channelHover[channel.key]}`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-white/15 bg-white/5">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-sans text-sm font-medium text-linen">
                        {channel.name}
                        {channel.live && (
                          <span className="relative flex h-1.5 w-1.5" aria-label="On air">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-danger" />
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block font-sans text-xs leading-snug text-sky/80">
                        {channel.cta}
                      </span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* ── Base bar ─────────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-shell flex-wrap gap-4 border-t border-sky/20 px-5 pb-10 pt-6 font-sans text-xs tracking-[0.04em] sm:px-6">
        <span>
          © {new Date().getFullYear()} {siteInfo.ministry}
        </span>
        <span className="text-gold sm:ms-auto">#PrepareTheWayTheMessiahIsComing</span>
      </div>
    </footer>
  )
}
