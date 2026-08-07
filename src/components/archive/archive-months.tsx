'use client'

import * as React from 'react'
import Link from 'next/link'

export interface ArchivePiece {
  key: string
  href: string
  /** "Friday 31 July" */
  dateLabel: string
  /** ISO date, for the <time> element. */
  publishedAt: string
  title: string
  /** The opening line — the reader starts reading here. */
  open: string
  /** Scripture reference, or the section it belongs to. */
  ref: string
}

export interface ArchiveMonth {
  /** "July 2026" */
  label: string
  pieces: ArchivePiece[]
}

const PILL_WIDTH = 150

/**
 * The archive: months down the left, pieces down the right.
 *
 * Three pieces of decoration live here, and all three are progressive —
 * the list is a plain, complete set of links before any of them run:
 *   1. rows fade up as they enter the viewport
 *   2. a gold wire draws down the row under the cursor (CSS, globals)
 *   3. a "Read more" pill trails the cursor on precise pointers only
 */
export function ArchiveMonths({
  months,
  opener,
}: {
  months: ArchiveMonth[]
  /** The newest piece, opened in place at the head of the first month. */
  opener?: React.ReactNode
}) {
  const pillRef = React.useRef<HTMLDivElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [pillOn, setPillOn] = React.useState(false)

  /* ── Scroll reveal ──────────────────────────────────────────── */
  React.useEffect(() => {
    const rows = rootRef.current?.querySelectorAll<HTMLElement>('.piece')
    if (!rows?.length) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm || !('IntersectionObserver' in window)) {
      rows.forEach((row) => row.setAttribute('data-reveal', 'in'))
      return
    }

    rows.forEach((row) => row.setAttribute('data-reveal', 'pending'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const row = entry.target as HTMLElement
          // Stagger within a month, capped so long months don't crawl.
          const siblings = Array.from(row.parentElement?.children ?? [])
          const step = Math.min(siblings.indexOf(row), 4)
          row.style.transitionDelay = `${step * 70}ms`
          row.setAttribute('data-reveal', 'in')
          io.unobserve(row)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
    )
    rows.forEach((row) => io.observe(row))
    return () => io.disconnect()
  }, [months])

  /* ── Cursor pill ────────────────────────────────────────────── */
  const pointer = React.useRef({ tx: 0, ty: 0, cx: 0, cy: 0, live: false, raf: 0 })

  const animate = React.useCallback(() => {
    const p = pointer.current
    p.cx += (p.tx - p.cx) * 0.18
    p.cy += (p.ty - p.cy) * 0.18
    if (pillRef.current) {
      pillRef.current.style.transform = `translate3d(${p.cx.toFixed(1)}px,${p.cy.toFixed(1)}px,0)`
    }
    p.raf = p.live || Math.abs(p.tx - p.cx) > 0.5 ? requestAnimationFrame(animate) : 0
  }, [])

  React.useEffect(() => () => cancelAnimationFrame(pointer.current.raf), [])

  const [fine, setFine] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setFine(query.matches && !calm.matches)
    sync()
    query.addEventListener('change', sync)
    calm.addEventListener('change', sync)
    return () => {
      query.removeEventListener('change', sync)
      calm.removeEventListener('change', sync)
    }
  }, [])

  const track = (event: React.MouseEvent) => {
    if (!fine) return
    const p = pointer.current
    p.tx = Math.min(event.clientX, window.innerWidth - PILL_WIDTH)
    p.ty = event.clientY
    if (!p.raf) p.raf = requestAnimationFrame(animate)
  }

  const pillHandlers = fine
    ? {
        onMouseEnter: (event: React.MouseEvent) => {
          const p = pointer.current
          p.cx = p.tx = Math.min(event.clientX, window.innerWidth - PILL_WIDTH)
          p.cy = p.ty = event.clientY
          p.live = true
          setPillOn(true)
          if (!p.raf) p.raf = requestAnimationFrame(animate)
        },
        onMouseMove: track,
        onMouseLeave: () => {
          pointer.current.live = false
          setPillOn(false)
        },
      }
    : {}

  return (
    <div ref={rootRef}>
      {fine && (
        <div
          ref={pillRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-40 will-change-transform"
        >
          <span
            className={`block origin-top-left translate-x-[18px] translate-y-[20px] whitespace-nowrap rounded-full bg-gold px-[1.15rem] py-[0.55rem] font-sans text-xs font-medium tracking-[0.05em] text-navy-900 transition-[opacity,transform] duration-300 ${
              pillOn ? 'scale-100 opacity-100' : 'scale-[0.55] opacity-0'
            }`}
          >
            Read more →
          </span>
        </div>
      )}

      {months.map((month, monthIndex) => {
        // The opener counts toward its month's tally but is not a row.
        const total = month.pieces.length + (monthIndex === 0 && opener ? 1 : 0)
        return (
        <section
          key={month.label}
          className={`grid grid-cols-1 items-start gap-4 md:grid-cols-[8.5rem_1fr] md:gap-8 ${monthIndex === 0 ? "pt-2" : "pt-10 md:pt-12"}`}
        >
          <h2 className="kicker sticky top-24 border-b border-thread pb-3 pt-1 font-semibold text-gold md:border-0 md:pb-0">
            {month.label}
            <small className="ms-2 font-normal normal-case tracking-[0.09em] text-ink-subtle md:ms-0 md:mt-1.5 md:block">
              {total} {total === 1 ? 'piece' : 'pieces'}
            </small>
          </h2>

          <div>
            {monthIndex === 0 && opener}
            {month.pieces.map((piece) => (
              <Link
                key={piece.key}
                href={piece.href}
                {...pillHandlers}
                className="piece -mx-4 block border-b border-thread px-4 py-6 last:border-b-0 first:pt-1 hover:bg-sand md:-mx-5 md:px-5 md:py-7"
              >
                <time
                  dateTime={piece.publishedAt}
                  data-shift="trail"
                  className="kicker mb-2 block text-ink-subtle"
                >
                  {piece.dateLabel}
                </time>
                <h3
                  data-shift="lead"
                  className="mb-2.5 font-display text-[1.35rem] font-normal leading-[1.18] tracking-[-0.012em] text-ink-strong sm:text-[1.55rem]"
                >
                  {piece.title}
                </h3>
                <p
                  data-shift="trail"
                  className="mb-3 text-[1.0625rem] leading-[1.62] text-ink-muted sm:text-lg"
                >
                  {piece.open}
                </p>
                <span
                  data-shift="trail"
                  className="block font-sans text-[0.6875rem] uppercase tracking-[0.11em] text-gold"
                >
                  {piece.ref}
                </span>
              </Link>
            ))}
          </div>
        </section>
        )
      })}
    </div>
  )
}
