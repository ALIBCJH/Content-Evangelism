import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RadioTower } from 'lucide-react'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { channels, footerColumns, siteInfo } from '@/lib/content'

const channelIcons = {
  radio: RadioTower,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
} as const

/**
 * The footer: the gold rule, the seal and what the site is, five columns
 * of where to go, the three official channels, and the legal bar.
 *
 * The columns are the site's own internal linking — without them the
 * masthead is the only route onward from any page, and link equity has
 * nowhere to circulate.
 *
 * It is set on `raised`, the same surface the masthead is set on, so the
 * two bookend the page and both turn over with the theme. It used to be
 * painted on the plate — the ministry's navy, which is navy in both
 * themes by definition — and a reader who chose the light theme got a
 * page that went dark at the bottom and stayed there. The plate is for
 * the ministry speaking in its own voice; a list of links is the site
 * speaking, and the site follows the reader's choice.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-raised text-ink-700">
      <div className="gold-rule" />

      <div className="shell grid gap-10 pb-10 pt-16 md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,1fr))]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              unoptimized
              className="h-[34px] w-[34px] rounded-full"
            />
            <span className="block max-w-[160px] font-display text-[0.9375rem] font-semibold leading-[1.15] text-navy">
              Ministry of Repentance &amp; Holiness
            </span>
          </div>
          <p className="max-w-[260px] text-[0.8125rem] leading-relaxed text-ink-500">
            The ministry&rsquo;s digital record of what it believes, teaches, has preached,
            and has documented.
          </p>

          {/* The three official channels. */}
          <ul className="mt-6 flex flex-wrap gap-2">
            {channels.map((channel) => {
              const Icon = channelIcons[channel.key]
              return (
                <li key={channel.key}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={channel.tagline}
                    className="focus-ring flex h-11 w-11 items-center justify-center rounded-tile border border-rule bg-card text-ink-700 transition-colors hover:border-gold hover:text-gold-ink"
                  >
                    <Icon aria-hidden className="h-5 w-5" />
                    <span className="sr-only">
                      {channel.name}
                      {channel.live ? ' — live now' : ''}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="kicker mb-4 text-gold-ink">{column.title}</p>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring text-[0.8125rem] text-ink-700 transition-colors hover:text-gold-ink"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="focus-ring text-[0.8125rem] text-ink-700 transition-colors hover:text-gold-ink"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-6 border-t border-rule pb-10 pt-6">
        <span className="text-xs text-ink-500">
          © {new Date().getFullYear()} {siteInfo.ministry}. All rights reserved.
        </span>
        <div className="flex flex-wrap gap-5 text-xs">
          <Link href="/about" className="focus-ring text-ink-500 transition-colors hover:text-gold-ink">
            About
          </Link>
          <Link href="/search" className="focus-ring text-ink-500 transition-colors hover:text-gold-ink">
            Search
          </Link>
          <a href="/feed.xml" className="focus-ring text-ink-500 transition-colors hover:text-gold-ink">
            RSS
          </a>
          <a href="/sitemap.xml" className="focus-ring text-ink-500 transition-colors hover:text-gold-ink">
            Sitemap
          </a>
        </div>
      </div>
    </footer>
  )
}
