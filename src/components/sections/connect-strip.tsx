import * as React from 'react'
import { ArrowUpRight, RadioTower } from 'lucide-react'
import { channelCtaTone, channelTone, WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { channels } from '@/lib/content'
import { SectionHeading } from '@/components/section-heading'
import { FadeIn } from '@/components/motion'

const channelIcons = {
  radio: RadioTower,
  youtube: YouTubeIcon,
  whatsapp: WhatsAppIcon,
} as const

/* Each card carries its channel's brand color on hover. */

/**
 * The channels band — after a reader has finished the front page, this is
 * the ask: listen to the radio, watch the services, send the site onward.
 */
export function ConnectStrip() {
  return (
    <section
      aria-label="Official channels"
      className="mx-auto max-w-7xl border-t border-hairline px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <SectionHeading
        kicker="Stay connected"
        title="Walk With the Ministry"
        lede="The reading room is one door among several. Listen to the station, watch the services, and pass the word along."
      />
      <FadeIn>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.key]
            return (
              <a
                key={channel.key}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-interactive focus-ring group flex flex-col p-6"
              >
                <span className="flex items-center justify-between">
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-2xl border ${channelTone[channel.key]}`}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  {channel.live && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger/30 bg-status-danger/10 px-2.5 py-1 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-status-danger">
                      <span className="relative flex h-1.5 w-1.5" aria-hidden>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-danger" />
                      </span>
                      On air
                    </span>
                  )}
                </span>
                <span className="mt-5 font-display text-xl font-semibold text-ink-strong">
                  {channel.name}
                </span>
                <span className="mt-2 font-serif text-sm leading-relaxed text-ink-muted">
                  {channel.tagline}
                </span>
                <span className={`mt-5 inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-kicker ${channelCtaTone[channel.key]}`}>
                  {channel.cta}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            )
          })}
        </div>
      </FadeIn>
    </section>
  )
}
