'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navSections, siteInfo } from '@/lib/content'
import type { SearchDoc } from '@/lib/search-docs'
import { SearchOverlay } from '@/components/search-overlay'

/**
 * The masthead: the seal and the wordmark on the left, the four sections
 * on the right, search beside them, and the gold rule closing the bar.
 *
 * From `lg` up the sections are laid out inline, so the whole site is one
 * click away without opening anything. Below that the wordmark alone fills
 * the bar and the menu button takes over — four sections would otherwise
 * crush the masthead on a phone.
 *
 * The drawer is built to full dialog standards, because at those widths it
 * is the only navigation there is: focus moves into it on open and back to
 * the button on close, Tab is trapped inside, Escape and the backdrop both
 * dismiss it, and the page behind it cannot scroll. Pressing "/" anywhere
 * opens search.
 */
export function SiteHeader({ docs = [] }: { docs?: SearchDoc[] }) {
  const [open, setOpen] = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const pathname = usePathname()

  const panelRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  /* Search has no button of its own in the masthead any more — it opens
     from the drawer or from the "/" key — so closing it hands focus back
     to whatever had it when it opened, rather than to a fixed control. */
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

  const isCurrent = (href: string) =>
    href === '/articles'
      ? pathname === '/articles' || pathname.startsWith('/articles/')
      : pathname.startsWith(href)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rule bg-raised">
        <div className="mx-auto flex h-[72px] max-w-shell items-center gap-6 px-5 sm:px-8 lg:gap-10">
          <Link
            href="/"
            className="focus-ring flex shrink-0 items-center gap-3 rounded-md"
          >
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              priority
              unoptimized
              className="h-[34px] w-[34px] rounded-full"
            />
            <span className="block max-w-[150px] font-display text-[0.9375rem] font-semibold leading-[1.15] tracking-[0.01em] text-navy">
              Ministry of Repentance &amp; Holiness
            </span>
          </Link>

          {/* The sections, inline. Below `lg` they live in the drawer. */}
          <nav aria-label="Primary" className="hidden flex-1 items-center justify-end gap-1 lg:flex">
            {navSections.map((section) => {
              const current = isCurrent(section.href)
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'focus-ring rounded-lg px-3.5 py-2.5 text-sm font-medium tracking-[0.01em] transition-colors',
                    current ? 'bg-chip text-navy' : 'text-navy hover:bg-chip'
                  )}
                >
                  {section.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center lg:hidden">
            <button
              ref={buttonRef}
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              className="focus-ring icon-only flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-tile border border-rule bg-card"
            >
              <span aria-hidden className="h-[1.75px] w-[18px] bg-navy" />
              <span aria-hidden className="h-[1.75px] w-[18px] bg-navy" />
              <span aria-hidden className="h-[1.75px] w-3 bg-navy" />
            </button>
          </div>
        </div>
        <div className="gold-rule opacity-[0.55]" />
      </header>

      {/* ── The drawer ───────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-navy-deep/60 backdrop-blur-[2px]"
          />
          <div
            ref={panelRef}
            className="absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] flex-col bg-raised shadow-drawer"
          >
            <div className="flex items-center justify-between border-b border-rule px-5 py-3.5">
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

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <button
                type="button"
                onClick={openSearch}
                className="focus-ring mb-5 flex w-full items-center gap-2.5 rounded-tile border border-rule bg-card px-4 py-3.5 text-left text-[0.9375rem] text-ink-subtle"
              >
                <Search aria-hidden className="h-[17px] w-[17px]" strokeWidth={1.75} />
                Search the archive…
              </button>

              <nav aria-label="Sections">
                {navSections.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    aria-current={isCurrent(section.href) ? 'page' : undefined}
                    className="flex min-h-[60px] items-center justify-between gap-4 border-b border-rule-soft py-3.5"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-[1.5rem] leading-tight text-navy">
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
                ))}
              </nav>

              <div className="mt-6 rounded-figure bg-navy p-5">
                <p className="kicker mb-2 text-gold-pale">The ministry</p>
                <p className="font-display text-[1.3125rem] leading-tight text-card">
                  {siteInfo.mission}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchOverlay
        docs={docs}
        open={searching}
        onClose={() => {
          setSearching(false)
          searchOpener.current?.focus()
        }}
      />
    </>
  )
}
