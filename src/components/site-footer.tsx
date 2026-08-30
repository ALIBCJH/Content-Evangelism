import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FollowChannel } from '@/components/follow-channel'
import { RadioTower } from 'lucide-react'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { channels, siteInfo } from '@/lib/content'

const channelIcons = {
  radio: RadioTower,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
} as const

/**
 * The footer: the gold rule, the seal and what the site is, the three
 * official channels, and the legal bar.
 *
 * There were five columns of links here, then three, and now none. They
 * were the site's own internal linking, and losing them is worth naming
 * rather than glossing: this is where a reader who has reached the bottom
 * of a page is offered somewhere else to go, and the offer is now the
 * legal bar and the masthead. Every destination they held is still
 * reachable — see the note over `footerColumns`' grave in content.ts.
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

      {/* The brand block, and nothing beside it. This was a grid of the
          block plus one track per column of links; with the columns gone
          a grid would be one child in the first of four tracks, so it is
          a block again. */}
      <div className="shell pb-10 pt-16">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
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

          {/* On every page, since a reader may decide to follow at any of
              them. Absent until a channel is configured. */}
          <FollowChannel className="mt-5" />

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
          {/* The bottom bar is the way to what a reader kept, and the bar
              is a phone's. Without this, saving on a desktop would put a
              teaching somewhere with no way back to it. */}
          <Link href="/saved" className="focus-ring text-ink-500 transition-colors hover:text-gold-ink">
            Saved
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
