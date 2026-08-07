'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navSections } from '@/lib/content'

/**
 * The masthead: one navy bar under a gold rule carrying the wordmark, search,
 * and the menu button — at every width.
 *
 * The menu is a drawer that slides in from the right over the page, rather
 * than an accordion that pushes it down. Because it is now the *only*
 * navigation on the site, it is built to full dialog standards: focus moves
 * into it on open and returns to the button on close, Tab is trapped inside
 * it, Escape and the backdrop both dismiss it, and the page behind it cannot
 * scroll while it is open.
 */
export function SiteHeader() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const reduce = useReducedMotion()

  const panelRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  // Remembers what to focus once the drawer closes.
  const wasOpen = React.useRef(false)

  // A tapped link navigates without unmounting the header, so close on route change.
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  /* Escape to dismiss, and Tab confined to the panel while it is open. */
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

  /* Hold the page still behind the drawer. Replacing the scrollbar with an
     equivalent padding stops the layout jumping as it is removed. */
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

  /* Move focus in on open; hand it back to the button on close. */
  React.useEffect(() => {
    if (open) {
      wasOpen.current = true
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus()
    } else if (wasOpen.current) {
      wasOpen.current = false
      buttonRef.current?.focus()
    }
  }, [open])

  // "Articles" is the archive at /, and an article page belongs to it too.
  const isCurrent = (href: string) =>
    href === '/'
      ? pathname === '/' || pathname.startsWith('/articles')
      : pathname.startsWith(href)

  return (
    <>
      <nav
        className="on-navy sticky top-0 z-50 border-b-2 border-gold bg-navy"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-shell items-center gap-4 px-5 py-4 sm:px-6">
          <Link
            href="/"
            className="mr-auto min-w-0 truncate font-display text-[1.0625rem] font-normal text-linen sm:text-[1.3rem]"
          >
            Repent <span className="italic text-sky">and</span> Prepare the Way
          </Link>

          <Link
            href="/search"
            aria-label="Search the archive"
            className="focus-ring icon-only grid h-10 w-10 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-linen"
          >
            <Search className="h-4 w-4" />
          </Link>
          <button
            ref={buttonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className="focus-ring icon-only grid h-10 w-10 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-linen"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
            {/* The page dims and recedes behind the panel. */}
            <motion.button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full cursor-default bg-navy-900/70 backdrop-blur-[2px]"
            />

            <motion.div
              ref={panelRef}
              initial={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
              transition={{ duration: reduce ? 0.01 : 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="on-navy absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col border-l-2 border-gold bg-navy shadow-[-24px_0_60px_-20px_rgba(12,30,58,0.65)]"
            >
              <div className="flex items-center justify-between px-7 py-4">
                <span className="kicker text-sky/70">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="focus-ring icon-only -mr-2 grid h-10 w-10 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-linen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ul className="flex-1 overflow-y-auto px-7 pt-2">
                {navSections.map((section) => {
                  const current = isCurrent(section.href)
                  return (
                    <li key={section.href} className="border-b border-white/10 last:border-b-0">
                      <Link
                        href={section.href}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'group flex items-baseline gap-3 py-5 font-display text-[1.7rem] font-light leading-none transition-colors',
                          current ? 'text-gold' : 'text-linen hover:text-sky'
                        )}
                      >
                        {/* A gold marker sits beside the section you are in. */}
                        <span
                          aria-hidden
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full bg-gold transition-opacity',
                            current ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {section.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <p className="border-t border-white/10 px-7 py-6 font-display text-[0.95rem] font-light italic leading-snug text-sky/80">
                Prepare ye the way of the LORD.
                <span className="mt-1.5 block font-sans text-[0.625rem] font-medium uppercase not-italic tracking-[0.2em] text-gold">
                  Isaiah 40:3
                </span>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
