import * as React from 'react'
import { RadioTower } from 'lucide-react'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { channels, siteInfo } from '@/lib/content'

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
 * The footer is the ministry's three channels and nothing else.
 *
 * The epigraph, the brand column, and the list of sections were all removed:
 * the sections are already in the menu, and the archive says what the site is
 * far better than a paragraph about it. What remains is the one thing the
 * footer is genuinely for — leaving for the radio, the videos, or a share —
 * so each channel gets a full card rather than a line in a list.
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

      <div className="shell flex flex-wrap gap-4 border-t border-sky/20 pb-10 pt-6 font-sans text-xs tracking-[0.04em]">
        <span>
          © {new Date().getFullYear()} {siteInfo.ministry}
        </span>
        <span className="text-gold sm:ms-auto">#PrepareTheWayTheMessiahIsComing</span>
      </div>
    </footer>
  )
}
