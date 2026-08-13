import * as React from 'react'
import Link from 'next/link'
import { homeHero } from '@/lib/content'

/**
 * The hero: one claim, and two ways in.
 *
 * It stands on the ministry's own navy rather than a photograph. That is
 * the design as it is drawn, and it is also the honest state of the page —
 * the ministry's own hero photograph has not been supplied, and borrowing
 * an article's picture to fill the space made the front page say something
 * about a teaching rather than about the ministry.
 *
 * Nothing else changes when a photograph does arrive: drop it behind this
 * block with the scrim the design specifies, and the type is already
 * placed for it.
 *
 * It is sized to fill the first screen exactly — the viewport less the
 * masthead standing above it — so the front page opens on the navy and
 * nothing else, with the featured article beginning at the fold rather
 * than peeking over it. `svh` rather than `vh` or `dvh`: the small
 * viewport is the one that holds still while a phone's address bar comes
 * and goes, so the hero does not resize under the reader mid-scroll.
 *
 * The type is centred in that screen rather than sitting on its floor.
 * At 660px the difference is slight, but on a tall desktop window the
 * bottom-anchored block left the upper half of the navy empty.
 */
export function HomeHero() {
  return (
    <section className="relative flex min-h-[calc(100svh-var(--masthead))] items-center overflow-hidden bg-navy-deep">
      <div className="mx-auto w-full max-w-shell px-5 py-16 sm:px-8 lg:py-20">
        <p className="mb-5 flex items-center gap-3">
          <span aria-hidden className="h-px w-[26px] bg-gold-pale" />
          <span className="kicker-lg text-gold-sand">{homeHero.kicker}</span>
        </p>

        <h1 className="mb-6 max-w-[900px] text-balance font-display text-[2.375rem] font-medium leading-[1.02] tracking-[-0.025em] text-[#FFFDF8] sm:text-[3.5rem] lg:text-[5.25rem] lg:leading-none">
          {homeHero.title.map((line, index) => (
            <React.Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </h1>

        <p className="mb-8 max-w-[600px] text-pretty text-[0.9375rem] leading-[1.65] text-[#DCE6EF] sm:text-[1.1875rem] lg:mb-10">
          {homeHero.dek}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
          <Link
            href={homeHero.primary.href}
            className="focus-ring rounded-tile bg-gold px-7 py-4 text-center text-[0.9375rem] font-bold text-[#1A1206] transition-colors hover:bg-gold-light"
          >
            {homeHero.primary.label}
          </Link>
          <Link
            href={homeHero.secondary.href}
            className="focus-ring rounded-tile border border-[#FFFDF8]/55 px-7 py-4 text-center text-[0.9375rem] font-semibold text-[#FFFDF8] transition-colors hover:bg-[#FFFDF8] hover:text-navy"
          >
            {homeHero.secondary.label}
          </Link>
        </div>
      </div>

      {/* The hero ends exactly at the fold now, so nothing below it peeks
          over the edge to say the page continues. This is that signal and
          only that — a gold hairline, which is what gold is for here, and
          decorative, so it is hidden from assistive technology that has
          the document outline to navigate by. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-8 mx-auto h-10 w-px bg-gradient-to-b from-transparent to-gold-pale/60"
      />
    </section>
  )
}
