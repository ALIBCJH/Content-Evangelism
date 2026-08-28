'use client'

import * as React from 'react'
import type { Heading } from '@/lib/toc'
import { minutesLeft, progressThrough, showsTimeLeft } from '@/components/progress-bar'

/**
 * Where the reader is in the teaching, pinned under the masthead.
 *
 * It replaces three things that were each half of this.
 *
 * A folded contents card sat between the standfirst and the first
 * sentence — a list of a dozen chapters that a reader had to decide about
 * before being allowed to start reading, and which then scrolled away and
 * was no use at the point it would have been.
 *
 * A chapter rail stood in the left margin from `xl`, which is a screen
 * width most of this ministry's readers do not have, and which reported
 * where they were in a place they were not looking.
 *
 * And a floating pill said how many minutes were left, in the top right
 * corner, unrelated to either.
 *
 * All three answer one question — how far into this am I, and what is
 * around me — so they are one strip: the chapter the reader is in, with
 * its number, how much of the teaching is left, and the whole list one
 * tap away. It travels with them, at every width, which is the only way
 * an answer to "where am I" is any use.
 *
 * The list opens on a `details` element rather than on state, and that is
 * the one thing the contents card got right and is worth keeping: a
 * chapter list is navigation, so it has to work as navigation does —
 * present in the markup for a crawler, openable in a new tab, and
 * reachable by keyboard with no script running at all. What the script
 * adds is which chapter is current and how much is left; a page with no
 * script still has every chapter and every anchor.
 */
export function ChapterBar({
  headings,
  targetId,
  readMinutes,
}: {
  headings: Heading[]
  /** The teaching itself — what the progress is measured against. */
  targetId: string
  readMinutes: number
}) {
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const [progress, setProgress] = React.useState(0)
  const list = React.useRef<HTMLDetailsElement>(null)

  React.useEffect(() => {
    let frame = 0

    const read = () => {
      /* Where the reader is. The line is a third of the way down the
         window rather than at its top: a heading that has just scrolled
         into view is not yet the section being read, and one that has
         just left the top of the screen still is. */
      const line = window.innerHeight * 0.33
      let current = -1
      headings.forEach((heading, index) => {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= line) current = index
      })
      setActiveIndex(current)

      const teaching = document.getElementById(targetId)
      if (teaching) {
        setProgress(
          progressThrough({
            top: teaching.getBoundingClientRect().top + window.scrollY,
            height: teaching.offsetHeight,
            scrollY: window.scrollY,
            viewport: window.innerHeight,
          })
        )
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [headings, targetId])

  /* A teaching with one chapter has no chapters. The strip would then be
     a minutes-left counter with a decorative number beside it. */
  if (headings.length < 2) return null

  /* Before a reader has scrolled, the chapter they are in is the first
     one. Not "none": a strip that opened blank and filled itself in on
     the first scroll would read as something still loading. */
  const shownIndex = Math.max(activeIndex, 0)

  return (
    <div className="sticky top-[72px] z-40 border-b border-rule bg-raised/95 backdrop-blur">
      <details ref={list} className="group">
        {/* The summary is the whole strip, and it is the first child of
            the details — anything between the two and the browser stops
            treating it as the disclosure and draws its own "Details"
            triangle instead. */}
        <summary className="focus-ring cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="shell">
            <div className="article-measure flex items-stretch gap-3">
              <span className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5">
                <span
                  aria-hidden
                  className="tabular font-mono text-[0.6875rem] tracking-[0.12em] text-gold"
                >
                  {String(shownIndex + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-apparatus text-[0.8125rem] leading-[1.4] text-ink-700">
                  {headings[shownIndex].text}
                </span>
                {/* Turns a quarter when it opens; the only moving part. */}
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span className="sr-only">Every chapter in this teaching</span>
              </span>

              {/* How much is left, not how far they have come. The past is
                  not a thing anybody is deciding about; what they are
                  deciding is whether to carry on, and that turns on what it
                  costs. Silent at the very top and at the very end — see
                  `showsTimeLeft`, which is where that rule lives. */}
              <span
                aria-live="polite"
                className="flex shrink-0 items-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-subtle"
              >
                {showsTimeLeft(progress) ? `${minutesLeft(readMinutes, progress)} min left` : ''}
              </span>
            </div>
          </div>
        </summary>

        <nav
          aria-label="Chapters in this teaching"
          /* `dvh`, so the list of chapters ends where the window actually
             ends on a phone rather than under the browser's own chrome. */
          className="max-h-[60dvh] overflow-y-auto overscroll-contain border-t border-rule-soft bg-raised"
        >
          <ol className="shell article-measure py-1">
            {headings.map((heading, index) => (
              <li key={heading.id} className="border-b border-rule-soft last:border-b-0">
                <a
                  href={`#${heading.id}`}
                  /* Folded again on the way out, so a reader who has
                     jumped is looking at the teaching rather than at the
                     list they used to get there. Closing it is the one
                     thing here that needs a script, and a reader without
                     one has still arrived where they were going. */
                  onClick={() => {
                    if (list.current) list.current.open = false
                  }}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  className="focus-ring group/row flex items-baseline gap-3.5 py-3 pr-2"
                >
                  <span aria-hidden className="tabular font-mono text-[0.6875rem] text-gold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`font-apparatus text-[0.9375rem] leading-snug transition-colors group-hover/row:text-gold ${
                      index === activeIndex ? 'font-semibold text-navy' : 'text-ink-700'
                    }`}
                  >
                    {heading.text}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </details>
    </div>
  )
}
