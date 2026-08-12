import * as React from 'react'
import Link from 'next/link'
import { RadioTower, Rss } from 'lucide-react'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { channels, navSections, siteInfo } from '@/lib/content'

const channelIcons = {
  radio: RadioTower,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
} as const

/* Brand hover colors so each channel reads instantly. */
const channelHover: Record<string, string> = {
  radio: 'hover:border-gold/60 hover:text-gold',
  youtube: 'hover:border-[#FF6B6B]/50 hover:text-[#FF6B6B]',
  whatsapp: 'hover:border-[#25D366]/50 hover:text-[#25D366]',
}

/**
 * The footer is the ministry's three channels, and a hairline of links.
 *
 * The epigraph, the brand column, and the stacked list of sections stay
 * gone: the archive says what the site is far better than a paragraph
 * about it, and each channel keeps a full card rather than a line in a
 * list. What came back is one quiet row of text in the legal bar.
 *
 * It earns its place. Without it the masthead was the only internal
 * linking on the entire site, so every page had exactly one route onward
 * and link equity had nowhere to circulate. A single row of small type
 * costs the design nothing and gives every page a second way out.
 */
export function SiteFooter() {
  return (
    <footer className="on-navy bg-navy text-sky">
      <div className="shell py-12 md:py-16">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.key]
            return (
              <li key={channel.key}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`focus-ring flex h-full items-center gap-4 rounded-sm border border-white/12 px-4 py-4 transition-colors hover:bg-white/5 sm:flex-col sm:items-start sm:gap-3 sm:px-5 sm:py-6 ${channelHover[channel.key]}`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-white/15 bg-white/5">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-sans text-[0.9375rem] font-medium text-linen">
                      {channel.name}
                      {channel.live && (
                        <span className="relative flex h-1.5 w-1.5" aria-label="On air">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-danger" />
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block font-sans text-xs leading-snug text-sky/80">
                      {channel.cta}
                    </span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="shell border-t border-sky/20 pb-10 pt-6 font-sans text-xs tracking-[0.04em]">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {navSections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="focus-ring text-sky/85 transition-colors hover:text-gold"
                >
                  {section.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="focus-ring text-sky/85 transition-colors hover:text-gold">
                Search
              </Link>
            </li>
            <li>
              <a
                href="/feed.xml"
                className="focus-ring inline-flex items-center gap-1.5 text-sky/85 transition-colors hover:text-gold"
              >
                <Rss aria-hidden className="h-3 w-3" />
                RSS
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-6 flex flex-wrap gap-4 border-t border-sky/12 pt-5">
          <span>
            © {new Date().getFullYear()} {siteInfo.ministry}
          </span>
          <span className="text-gold sm:ms-auto">#PrepareTheWayTheMessiahIsComing</span>
        </div>
      </div>
    </footer>
  )
}
