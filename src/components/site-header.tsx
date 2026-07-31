'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Cross, Menu, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { navSections, radioChannel, siteInfo, whatsappChannel, youtubeChannel } from '@/lib/content'
import { WhatsAppIcon, YouTubeIcon } from '@/components/brand-icons'
import { ThemeToggle } from '@/components/theme-toggle'

/** The pulsing on-air dot for the Listen Live affordances. */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-status-danger" />
    </span>
  )
}

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 170)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ── Primary navigation — pinned to the very top. Kept OUTSIDE the
          <header> box: position:sticky can only stick within its parent,
          so the nav must be a direct child of the page flow. ──────── */}
      <nav
        className={cn(
          'sticky top-0 z-50 border-b border-hairline transition-shadow duration-300',
          scrolled ? 'glass-strong shadow-glow-soft' : 'bg-canvas/80 backdrop-blur-md'
        )}
        aria-label="Primary"
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Dateline, replaced by the monogram once the masthead scrolls away */}
          <div className="relative flex h-full min-w-0 items-center">
            <p
              suppressHydrationWarning
              className={cn(
                'whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle transition-opacity duration-300',
                scrolled && 'opacity-0'
              )}
            >
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
            <Link
              href="/"
              tabIndex={scrolled ? 0 : -1}
              aria-hidden={!scrolled}
              className={cn(
                'absolute left-0 whitespace-nowrap font-display text-base font-bold text-ink-strong transition-opacity duration-300',
                !scrolled && 'pointer-events-none opacity-0'
              )}
            >
              R<span className="text-gold">✦</span>P
            </Link>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            {navSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="kicker whitespace-nowrap text-ink-muted transition-colors hover:text-gold"
              >
                {section.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={radioChannel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring hidden h-8 items-center gap-2 whitespace-nowrap rounded-full border border-hairline-strong px-3 font-sans text-[0.625rem] font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold sm:inline-flex"
              title={`${radioChannel.name} — ${radioChannel.cta}`}
            >
              <LiveDot />
              Listen Live
            </a>
            <Link
              href="/search"
              aria-label="Search the archive"
              className="focus-ring icon-only grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink-strong"
            >
              <Search className="h-4 w-4" />
            </Link>
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="focus-ring icon-only grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink-strong md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-hairline md:hidden"
            >
              <div className="glass-strong space-y-1 px-4 py-4 sm:px-6">
                {navSections.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    onClick={() => setMenuOpen(false)}
                    className="kicker block rounded-lg px-3 py-3 text-ink-muted transition-colors hover:bg-surface-2 hover:text-gold"
                  >
                    {section.label}
                  </Link>
                ))}

                {/* Official channels — the mobile menu is where most
                    readers will reach for them. */}
                <div className="mt-2 border-t border-hairline pt-3">
                  <a
                    href={radioChannel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kicker flex items-center gap-3 rounded-lg px-3 py-3 text-ink-muted transition-colors hover:bg-surface-2 hover:text-gold"
                  >
                    <LiveDot />
                    Listen Live · {radioChannel.name}
                  </a>
                  <a
                    href={youtubeChannel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kicker flex items-center gap-3 rounded-lg px-3 py-3 text-ink-muted transition-colors hover:bg-surface-2 hover:text-[#FF3333]"
                  >
                    <YouTubeIcon className="h-4 w-4" />
                    Watch on YouTube
                  </a>
                  <a
                    href={whatsappChannel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kicker flex items-center gap-3 rounded-lg px-3 py-3 text-ink-muted transition-colors hover:bg-surface-2 hover:text-[#25D366]"
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

      {/* ── Masthead ───────────────────────────────────────────── */}
      <header className="mx-auto max-w-7xl px-4 pb-6 pt-8 text-center sm:px-6 md:pb-8 md:pt-10 lg:px-8">
        <div className="ornament mx-auto max-w-md">
          <Cross className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <Link href="/" className="mt-4 inline-block">
          <h1 className="font-display text-3xl font-bold tracking-masthead text-ink-strong sm:text-5xl md:text-6xl">
            {siteInfo.name}
          </h1>
        </Link>
        <p className="kicker mt-4 text-ink-subtle">
          {siteInfo.ministry} <span aria-hidden className="mx-1 text-gold">✦</span> {siteInfo.head}
        </p>
      </header>
    </>
  )
}
