'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, BookOpen, GraduationCap, Info, RadioTower, Search, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { navSections, siteInfo } from '@/lib/content'
import { SearchOverlay } from '@/components/search-overlay'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * The masthead: the seal and the wordmark on the left, the four sections
 * on the right, search beside them, and the gold rule closing the bar.
 *
 * Search has a control at every width now. Below `lg` it had none: it
 * opened from the "/" key, which a phone does not have, and from a line
 * inside the menu sheet — so the archive's own way in cost two taps and a
 * guess on the device this site is mostly read on. It is a button in the
 * bar beside the menu, where a reader looks for it.
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
/**
 * A mark for each destination in the drawer.
 *
 * Keyed by the path rather than the label, so renaming a section in the
 * navigation does not silently drop its icon; a path with no mark falls
 * back to the book, which is what most of this site is.
 */
const SECTION_ICON: Record<string, typeof BookOpen> = {
  '/': BookOpen,
  '/prophecies': RadioTower,
  '/teachings': GraduationCap,
  '/about': Info,
}

export function SiteHeader() {
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
  /* Search opens from the button below `lg`, from the sheet, from the
     footer and from the "/" key — four different openers, so closing it
     hands focus back to whatever had it when it opened rather than to any
     one of them. */
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
        {/* `gap-6` below `sm` was 24px the narrowest phone did not have.
            The row carries three controls there now, and at 320px the
            brand and the controls together wanted 424px of a 320px bar —
            which `overflow-x: clip` on the body hid by simply cutting the
            menu button off the end of the world. Nothing in here is
            `shrink-0` any more except the controls themselves. */}
        <div className="mx-auto flex h-[72px] max-w-shell items-center gap-3 px-5 sm:gap-6 sm:px-8 lg:gap-10">
          <Link href="/" className="focus-ring flex min-w-0 items-center gap-3 rounded-md">
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              priority
              className="h-[34px] w-[34px] shrink-0 rounded-full"
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
          {/* Search, from `xl` — where the sections have left the bar and
              the space they were using is the space this needs. It is the
              same overlay the phone's search button opens, drawn as a
              field because at that width it is the only thing in the bar
              besides the masthead and it should look like something a
              reader can type into. */}
          <button
            type="button"
            onClick={openSearch}
            className="focus-ring ml-8 hidden h-10 min-w-[15rem] items-center gap-2.5 rounded-full border border-rule bg-card px-4 text-left text-ink-subtle transition-colors hover:border-rule-strong xl:flex"
          >
            <Search aria-hidden className="h-[1.0625rem] w-[1.0625rem] shrink-0" strokeWidth={1.8} />
            <span className="font-sans text-[0.9375rem]">Search articles and verses</span>
          </button>

          {/* Inline from `lg`, and gone again at `xl` — from there the
              sections are a rail down the left of the page, and carrying
              them twice would be two answers to "where am I". Below `lg`
              they live in the sheet, as before. */}
          <nav
            aria-label="Primary"
            className="hidden flex-1 items-center justify-end gap-1 lg:flex xl:hidden"
          >
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:hidden">
            <button
              type="button"
              aria-label="Search the archive"
              onClick={openSearch}
              className="focus-ring icon-only flex h-11 w-11 items-center justify-center rounded-tile border border-rule bg-card text-navy"
            >
              <Search aria-hidden className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.9} />
            </button>
            {/* Not below `sm`. The toggle is 64px wide and the smallest
                phones this site is read on are 320: seal, name, search,
                theme and menu do not fit, and something had to give. Of
                the three controls it is the only one that is a preference
                rather than a way to move around the site, so it is the
                one that goes behind a tap — it is a line in the sheet at
                that width. From `sm` up it is back in the corner, which
                is where a reader looks for it. */}
            <ThemeToggle className="hidden sm:inline-flex" />
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

            {/* A drawer off the edge the button is on, full height, over a
                scrim: the shape every phone already knows from its mail
                and its settings. One line per destination, a mark beside
                it, and the page you are on held in a pill — which is how
                a reader is told where they are without reading anything.

                It comes from the right because the button is on the
                right. Sliding in from the far side is the complaint that
                got the bottom sheet replaced. */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={spring}
              className="absolute inset-y-0 right-0 flex w-[min(19.5rem,86vw)] flex-col overflow-hidden border-l border-rule bg-raised shadow-drawer"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-4">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Image
                    src="/logo.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full"
                  />
                  {/* Two lines rather than an ellipsis: the name of the
                      publication is not a thing to abbreviate. */}
                  <span className="font-display text-[0.875rem] font-semibold leading-[1.2] text-navy">
                    {siteInfo.name}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="focus-ring icon-only grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-navy"
                >
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
                <nav aria-label="Sections">
                  <ul className="flex flex-col gap-0.5">
                    {navSections.map((section) => {
                      const current = isCurrent(section.href)
                      const Icon = SECTION_ICON[section.href] ?? BookOpen
                      return (
                        <li key={section.href}>
                          <Link
                            href={section.href}
                            aria-current={current ? 'page' : undefined}
                            className={cn(
                              'flex min-h-[48px] items-center gap-4 rounded-full pl-4 pr-5 transition-colors',
                              current
                                ? 'bg-chip-gold font-semibold text-gold-ink'
                                : 'text-ink-700 active:bg-surface-2'
                            )}
                          >
                            <Icon
                              aria-hidden
                              className={cn('h-[1.125rem] w-[1.125rem] shrink-0', current ? 'text-gold-ink' : 'text-ink-subtle')}
                              strokeWidth={current ? 2.2 : 1.8}
                            />
                            <span className="truncate font-sans text-[0.9375rem]">
                              {section.label}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </nav>

                {/* What the sections are not. Search is a button in the
                    bar at every width now, so what belongs here is the
                    other thing a phone had no route to: the pieces a
                    reader put aside. Saving worked below `sm` and the way
                    back to what was saved did not — the filter lives in a
                    band this width never draws, and the only other door
                    was a twelve-pixel link in the footer's legal bar. */}
                <div className="my-2 border-t border-rule" />

                <Link
                  href="/saved"
                  aria-current={pathname === '/saved' ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[48px] items-center gap-4 rounded-full pl-4 pr-5 transition-colors',
                    pathname === '/saved'
                      ? 'bg-chip-gold font-semibold text-gold-ink'
                      : 'text-ink-700 active:bg-surface-2'
                  )}
                >
                  <Bookmark
                    aria-hidden
                    className={cn(
                      'h-[1.125rem] w-[1.125rem] shrink-0',
                      pathname === '/saved' ? 'text-gold-ink' : 'text-ink-subtle'
                    )}
                    strokeWidth={pathname === '/saved' ? 2.2 : 1.8}
                  />
                  <span className="font-sans text-[0.9375rem]">Saved</span>
                </Link>

                <button
                  type="button"
                  onClick={openSearch}
                  className="flex min-h-[48px] w-full items-center gap-4 rounded-full pl-4 pr-5 text-ink-700 transition-colors active:bg-surface-2"
                >
                  <Search aria-hidden className="h-[1.125rem] w-[1.125rem] shrink-0 text-ink-subtle" strokeWidth={1.8} />
                  <span className="font-sans text-[0.9375rem]">Search the archive</span>
                </button>

                {/* Where the theme toggle lives below `sm`, since the bar
                    at that width has no room for it — see the note in the
                    masthead. Above `sm` it is in the corner and this row
                    is not drawn, so the control is never in two places. */}
                <div className="flex min-h-[48px] items-center justify-between gap-4 pl-4 pr-3 sm:hidden">
                  <span className="font-sans text-[0.9375rem] text-ink-700">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SearchOverlay
        open={searching}
        onClose={() => {
          setSearching(false)
          searchOpener.current?.focus?.()
        }}
      />
    </>
  )
}
