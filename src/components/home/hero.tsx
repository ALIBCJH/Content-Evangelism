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
 */
export function HomeHero() {
  return (
    <section className="flex min-h-[420px] items-end overflow-hidden bg-navy-deep sm:min-h-[560px] lg:min-h-[660px]">
      <div className="mx-auto w-full max-w-shell px-5 pb-14 pt-24 sm:px-8 lg:pb-[72px] lg:pt-[120px]">
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
    </section>
  )
}
