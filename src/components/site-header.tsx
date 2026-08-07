'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navSections, radioChannel, whatsappChannel, youtubeChannel } from '@/lib/content'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'

/** The pulsing on-air dot for the Listen Live affordances. */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-status-danger" />
    </span>
  )
}

/**
 * The masthead is the navigation. One navy bar under a gold rule carries the
 * wordmark, the sections, and the live-radio link — no separate banner, so a
 * phone spends its first screen on the article rather than on chrome.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pathname = usePathname()

  // A tapped link navigates without unmounting the nav, so close the panel
  // ourselves whenever the route changes.
  React.useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // "Articles" is the archive at /, and an article page belongs to it too.
  const isCurrent = (href: string) =>
    href === '/'
      ? pathname === '/' || pathname.startsWith('/articles')
      : pathname.startsWith(href)

  return (
    <nav
      className="on-navy sticky top-0 z-50 border-b-2 border-gold bg-navy"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-shell items-center gap-6 px-5 py-4 sm:px-6">
        <Link
          href="/"
          className="mr-auto min-w-0 truncate font-display text-[1.0625rem] font-normal text-linen sm:text-[1.3rem]"
        >
          Repent <span className="italic text-sky">and</span> Prepare the Way
        </Link>

        {/* Desktop + tablet sections */}
        <div className="hidden items-center gap-7 md:flex">
          {navSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              aria-current={isCurrent(section.href) ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap border-b-2 pb-[3px] font-sans text-[0.8125rem] tracking-[0.04em] transition-colors',
                isCurrent(section.href)
                  ? 'border-gold text-linen'
                  : 'border-transparent text-sky hover:text-linen'
              )}
            >
              {section.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <a
            href={radioChannel.href}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring hidden h-8 items-center gap-2 whitespace-nowrap rounded-full border border-sky/40 px-3 font-sans text-[0.6875rem] font-medium uppercase tracking-kicker text-sky transition-colors hover:border-gold hover:text-gold lg:inline-flex"
            title={`${radioChannel.name} — ${radioChannel.cta}`}
          >
            <LiveDot />
            Listen Live
          </a>
          <Link
            href="/search"
            aria-label="Search the archive"
            className="focus-ring icon-only grid h-10 w-10 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-linen"
          >
            <Search className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="focus-ring icon-only grid h-10 w-10 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-linen md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            id="site-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/15 bg-navy md:hidden"
          >
            <div className="mx-auto max-w-shell px-5 pb-5 pt-2 sm:px-6">
              {navSections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  aria-current={isCurrent(section.href) ? 'page' : undefined}
                  className={cn(
                    'block py-3 font-sans text-[0.95rem] transition-colors',
                    isCurrent(section.href) ? 'text-gold' : 'text-sky hover:text-linen'
                  )}
                >
                  {section.label}
                </Link>
              ))}

              {/* Official channels — the mobile menu is where most readers
                  will reach for them. */}
              <div className="mt-2 border-t border-white/15 pt-3">
                <a
                  href={radioChannel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 font-sans text-[0.8125rem] text-sky transition-colors hover:text-gold"
                >
                  <LiveDot />
                  Listen Live · {radioChannel.name}
                </a>
                <a
                  href={youtubeChannel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 font-sans text-[0.8125rem] text-sky transition-colors hover:text-[#FF6B6B]"
                >
                  <YouTubeIcon className="h-4 w-4" />
                  Watch on YouTube
                </a>
                <a
                  href={whatsappChannel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 font-sans text-[0.8125rem] text-sky transition-colors hover:text-[#25D366]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Share on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
