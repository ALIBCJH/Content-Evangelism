import * as React from 'react'
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
 * The footer: a gold rule and one bar.
 *
 * There were five columns of links here, then three, then none, and then
 * a seal, the ministry's name, a sentence about the site and a stack of
 * channel buttons standing on their own above the legal bar. That stack
 * was the last thing left to cut, and cutting it is the point: the
 * masthead already carries the seal and the name on every page, so the
 * footer was introducing the publication to a reader who had just read
 * one of its teachings.
 *
 * What survives is what a footer is actually for — where a reader who
 * has reached the bottom can still go — and every one of those is here
 * because it is the *only* way to somewhere. The three channels are the
 * site's only route off it to the ministry's own broadcasts. Saved is the
 * only way back to what a reader kept on a desktop, where there is no
 * menu sheet to hold it. RSS and the sitemap are addressed to machines
 * and belong nowhere else. Nothing here is decoration, which is why
 * there is nothing here to cut.
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

      <div className="shell flex flex-wrap items-center justify-between gap-x-8 gap-y-5 py-7">
        <span className="text-xs text-ink-500">
          © {new Date().getFullYear()} {siteInfo.ministry}. All rights reserved.
        </span>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {/* The three official channels, in the bar rather than above
              it. They were 44px tiles in a block of their own; as marks
              on the same line as the links they are the same three
              destinations taking a tenth of the room. */}
          <ul className="flex items-center gap-3.5">
            {channels.map((channel) => {
              const Icon = channelIcons[channel.key]
              return (
                <li key={channel.key}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={channel.tagline}
                    className="focus-ring block rounded-sm text-ink-500 transition-colors hover:text-gold-ink"
                  >
                    <Icon aria-hidden className="h-[1.0625rem] w-[1.0625rem]" />
                    <span className="sr-only">
                      {channel.name}
                      {channel.live ? ' — live now' : ''}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-wrap gap-5 text-xs">
            {/* A text link now rather than a bordered pill. It is a
                different destination from the WhatsApp mark beside it —
                that is the ministry's number, this is the channel new
                teachings are announced on — so it stays, at the weight a
                footer link should be. */}
            <FollowChannel />
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
      </div>
    </footer>
  )
}
