import * as React from 'react'
import Link from 'next/link'
import { homeHero } from '@/lib/content'

/**
 * The hero: one claim, and two ways in.
 *
 * It is set on paper rather than on the ministry's navy, and continues
 * the masthead's own ground — so the front page opens as one field of
 * cream carrying the claim, with the navy kept for the chrome and the
 * primary button rather than spent as a full screen of paint.
 *
 * That inverts what it was: the headline is navy on cream instead of
 * cream on navy, the kicker takes the darker gold that reads on paper,
 * and the dek takes running-text ink instead of the pale blue that was
 * only ever legible against the deep ground.
 *
 * It is sized by its own content. The block ran a full viewport high
 * while it was a navy field, which is a thing a photograph can carry and
 * a paragraph cannot; on paper the same height would simply be an empty
 * page. A hairline at the shell's width closes it, and the featured
 * article begins below.
 */
export function HomeHero() {
  return (
    <section className="bg-raised">
      <div className="mx-auto w-full max-w-shell px-5 pb-0 pt-14 sm:px-8 lg:pt-16">
        <p className="mb-5 flex items-center gap-3">
          <span aria-hidden className="h-px w-[26px] bg-gold" />
          <span className="kicker-lg text-gold">{homeHero.kicker}</span>
        </p>

        <h1 className="mb-6 max-w-[900px] text-balance font-display text-[2.375rem] font-medium leading-[1.05] tracking-[-0.025em] text-navy sm:text-[3.25rem] lg:text-[4.5rem] lg:leading-[1.04]">
          {homeHero.title.map((line, index) => (
            <React.Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </h1>

        <p className="mb-8 max-w-[560px] text-pretty text-[0.9375rem] leading-[1.7] text-ink-700 sm:text-[1.0625rem] lg:mb-10">
          {homeHero.dek}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
          {/* Navy carries the primary action now that it is no longer the
              ground. Gold stays a rule and an accent, as the design has
              it, rather than becoming a second field of paint. */}
          <Link
            href={homeHero.primary.href}
            data-track="hero-primary"
            className="focus-ring rounded-tile bg-navy px-7 py-4 text-center text-[0.9375rem] font-semibold text-card transition-colors hover:bg-navy-deep"
          >
            {homeHero.primary.label}
          </Link>
          <Link
            href={homeHero.secondary.href}
            data-track="hero-secondary"
            className="focus-ring rounded-tile border border-gold-pale bg-card px-7 py-4 text-center text-[0.9375rem] font-semibold text-navy transition-colors hover:border-gold hover:bg-chip-gold"
          >
            {homeHero.secondary.label}
          </Link>
        </div>

        {/* The close. Inset to the shell rather than run full-bleed: the
            hero and the band beneath it share a ground now, so the rule is
            what separates them, and it lines up with the type it follows. */}
        <div className="mt-14 border-t border-rule lg:mt-16" />
      </div>
    </section>
  )
}
