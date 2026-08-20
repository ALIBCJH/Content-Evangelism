'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { navSections, siteInfo } from '@/lib/content'
import type { SearchDoc } from '@/lib/search-docs'
import { SearchOverlay } from '@/components/search-overlay'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * The masthead: the seal and the wordmark on the left, the four sections
 * on the right, search beside them, and the gold rule closing the bar.
 *
 * From `lg` up the sections are laid out inline, so the whole site is one
 * click away without opening anything. Below that the wordmark alone fills
 * the bar and the menu button takes over — four sections would otherwise
 * crush the masthead on a phone.
 *
 * On a phone the sections are a sheet that comes up from the bottom rather
 * than a panel that slides in from the side. That is where a thumb is: a
 * drawer pinned to the top-right corner of a six-inch screen asks a reader
 * to reach across the whole device to close what they just opened. The
 * sheet can be flung back down, which is the gesture a sheet promises, and
 * the handle at its head says so before anyone tries.
 *
 * The section a reader is in is marked by one gold rule that travels
 * between the sections rather than appearing and disappearing under each —
 * so the eye follows where it went, and the answer to "where am I" is
 * given by movement instead of by re-reading the bar. It is the same
 * marker in the sheet, and it respects a reduced-motion preference by
 * simply being where it belongs without the journey.
 *
 * The sheet is built to full dialog standards, because at those widths it
 * is the only navigation there is: focus moves into it on open and back to
 * the button on close, Tab is trapped inside, Escape and the backdrop both
 * dismiss it, and the page behind it cannot scroll.
 *
 * It holds the four sections and nothing else. It used to open with a
 * search box and close with a card carrying the ministry's tagline, and
 * both cost the reader the thing they opened the menu for: the sections
 * arrived one at a time behind a staggered entrance that took a third of
 * a second to finish. The sheet slides up and its contents are already
 * there. Pressing "/" still opens search on a keyboard.
 */
export function SiteHeader({ docs = [] }: { docs?: SearchDoc[] }) {
  const [open, setOpen] = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const pathname = usePathname()
  const still = useReducedMotion()

  /* One spring, used by everything that moves, so the sheet and the marker
     are recognisably the same piece of software. */
  const spring = still
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.9 }

  const panelRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  /* Search has no button in the masthead or in the sheet — it opens from
     the "/" key and from the footer — so closing it hands focus back to
     whatever had it when it opened, rather than to a fixed control. */
  const searchOpener = React.useRef<HTMLElement | null>(null)
  const wasOpen = React.useRef(false)

  const openSearch = React.useCallback(() => {
    searchOpener.current = (document.activeElement as HTMLElement) ?? null
    setOpen(false)
    setSearching(true)
  }, [])

  React.useEffect(() => {
    setOpen(false)
    setSearching(false)
  }, [pathname])

  /* Widening to the rail hides the menu button; close the drawer with it
     so the panel is never left open with no visible way to dismiss it. */
  React.useEffect(() => {
    const rail = window.matchMedia('(min-width: 1024px)')
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }
    rail.addEventListener('change', onChange)
    return () => rail.removeEventListener('change', onChange)
  }, [])

  /* "/" opens search — unless the reader is already typing somewhere. */
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (event.key === '/' && !typing) {
        event.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openSearch])

  /* Escape to dismiss the drawer, and Tab confined to it while it is open. */
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  /* Hold the page still behind the drawer, replacing the scrollbar with an
     equivalent padding so the layout does not jump as it is removed. */
  React.useEffect(() => {
    if (!open) return
    const { body } = document
    const gap = window.innerWidth - document.documentElement.clientWidth
    const overflow = body.style.overflow
    const padding = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`
    return () => {
      body.style.overflow = overflow
      body.style.paddingRight = padding
    }
  }, [open])

  React.useEffect(() => {
    if (open) {
      wasOpen.current = true
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus()
    } else if (wasOpen.current) {
      wasOpen.current = false
      buttonRef.current?.focus()
    }
  }, [open])

  /* Articles is the front page now, and it is also the section every
     teaching and topic belongs to — so it is current on `/` and on
     anything under /articles or /topics, but not on /about. */
  const isCurrent = (href: string) =>
    href === '/'
      ? pathname === '/' || pathname.startsWith('/articles') || pathname.startsWith('/topics')
      : pathname.startsWith(href)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rule bg-raised">
        <div className="mx-auto flex h-[72px] max-w-shell items-center gap-6 px-5 sm:px-8 lg:gap-10">
          <Link href="/" className="focus-ring flex shrink-0 items-center gap-3 rounded-md">
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              priority
              unoptimized
              className="h-[34px] w-[34px] rounded-full"
            />
            {/* The publication's own name, which is what a masthead
                carries. The ministry it belongs to is named in full on
                every page of the footer, in the About page, and in the
                structured data a search engine reads — none of which
                changes here. */}
            <span className="block max-w-[150px] font-display text-[0.9375rem] font-semibold leading-[1.15] tracking-[0.01em] text-navy">
              {siteInfo.name}
            </span>
          </Link>

          {/* The sections, inline. Below `lg` they live in the sheet. */}
          <nav aria-label="Primary" className="hidden flex-1 items-center justify-end gap-1 lg:flex">
            {navSections.map((section) => {
              const current = isCurrent(section.href)
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'focus-ring relative rounded-lg px-3.5 py-2.5 text-sm font-medium tracking-[0.01em] transition-colors',
                    current ? 'text-navy' : 'text-navy/85 hover:text-navy'
                  )}
                >
                  {/* Two marks, one shared identity each: the chip the
                      section sits in and the gold rule under it both
                      travel from the section left to the section arrived
                      at, because they are the same element re-parented. */}
                  {current && (
                    <>
                      <motion.span
                        layoutId="nav-current-chip"
                        aria-hidden
                        transition={spring}
                        className="absolute inset-0 -z-10 rounded-lg bg-chip"
                      />
                      <motion.span
                        layoutId="nav-current-rule"
                        aria-hidden
                        transition={spring}
                        className="absolute inset-x-3.5 -bottom-[9px] h-[2px] rounded-full bg-gold"
                      />
                    </>
                  )}
                  {section.label}
                </Link>
              )
            })}
          </nav>

          {/* Light or dark. It sits outside the nav because it is not a
              place to go, and it is the last thing in the row on both
              layouts — the corner is where a reader looks for it. */}
          <ThemeToggle className="ml-auto hidden lg:ml-2 lg:flex" />

          <div className="ml-auto flex shrink-0 items-center gap-2.5 lg:hidden">
            <ThemeToggle />
            <button
              ref={buttonRef}
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen((was) => !was)}
              className="focus-ring icon-only relative flex h-11 w-11 items-center justify-center rounded-tile border border-rule bg-card"
            >
              {/* Three bars that become a cross: the button says what it
                  will do next by being the thing it will turn into. */}
              <motion.span
                aria-hidden
                animate={open ? { rotate: 45, y: 0, width: 18 } : { rotate: 0, y: -5.5, width: 18 }}
                transition={spring}
                className="absolute h-[1.75px] rounded-full bg-navy"
              />
              <motion.span
                aria-hidden
                animate={open ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: still ? 0 : 0.16 }}
                className="absolute h-[1.75px] w-[18px] rounded-full bg-navy"
              />
              <motion.span
                aria-hidden
                animate={open ? { rotate: -45, y: 0, width: 18 } : { rotate: 0, y: 5.5, width: 12 }}
                transition={spring}
                className="absolute h-[1.75px] rounded-full bg-navy"
              />
            </button>
          </div>
        </div>

        <div className="gold-rule opacity-[0.55]" />
      </header>

      {/* ── The sheet ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[60] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: still ? 0 : 0.2 }}
              className="absolute inset-0 h-full w-full cursor-default bg-plate-deep/70"
            />

            <motion.div
              ref={panelRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              /* Flung down, it goes: past a fifth of its height or a
                 decisive flick, whichever comes first. Dragging up does
                 nothing, so the sheet cannot be pulled off the screen. */
              drag={still ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.45 }}
              onDragEnd={(_event, info) => {
                if (info.offset.y > 120 || info.velocity.y > 550) setOpen(false)
              }}
              className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-[24px] border-t border-rule bg-raised shadow-drawer"
            >
              <div className="flex shrink-0 cursor-grab flex-col items-center pb-1 pt-3 active:cursor-grabbing">
                <span aria-hidden className="h-1.5 w-11 rounded-full bg-rule-strong" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3 pt-1">
                <span className="kicker text-ink-subtle">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="focus-ring icon-only grid h-11 w-11 place-items-center rounded-tile border border-rule bg-card text-navy"
                >
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <nav aria-label="Sections">
                  <ul>
                    {navSections.map((section) => {
                      const current = isCurrent(section.href)
                      return (
                        <li key={section.href}>
                          <Link
                            href={section.href}
                            aria-current={current ? 'page' : undefined}
                            className={cn(
                              'relative flex min-h-[64px] items-center justify-between gap-4 rounded-tile py-3.5 pl-4 pr-3 transition-colors',
                              current ? 'bg-chip' : 'active:bg-chip/60'
                            )}
                          >
                            {current && (
                              <span
                                aria-hidden
                                className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-gold"
                              />
                            )}
                            <span className="min-w-0">
                              <span className="block font-display text-[1.375rem] leading-tight text-navy">
                                {section.label}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                                {section.items.slice(0, 3).join(' · ')}
                              </span>
                            </span>
                            <span aria-hidden className="font-mono text-base text-gold">
                              →
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SearchOverlay
        docs={docs}
        open={searching}
        onClose={() => {
          setSearching(false)
          searchOpener.current?.focus?.()
        }}
      />
    </>
  )
}
