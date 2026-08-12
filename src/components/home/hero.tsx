import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { homeHero } from '@/lib/content'

/**
 * The hero: one photograph, one claim, and two ways in.
 *
 * The scrim is a three-stop gradient rather than a flat wash, so the top
 * of the photograph stays legible while the type at the foot sits on
 * something close to solid navy. Everything above the buttons is
 * pointer-transparent — the picture behind it is never a dead zone.
 */
export function HomeHero() {
  return (
    <section className="relative flex min-h-[420px] items-end overflow-hidden bg-navy-deep sm:min-h-[560px] lg:min-h-[660px]">
      <Image
        src={homeHero.image.src}
        alt={homeHero.image.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,34,54,0.20) 0%, rgba(13,34,54,0.42) 42%, rgba(13,34,54,0.88) 100%)',
        }}
      />

      <div className="pointer-events-none relative mx-auto w-full max-w-shell px-5 pb-14 pt-24 sm:px-8 lg:pb-[72px] lg:pt-[120px]">
        <p className="mb-5 flex items-center gap-3">
          <span aria-hidden className="h-px w-[26px] bg-gold-pale" />
          <span className="kicker-lg text-gold-sand">{homeHero.kicker}</span>
        </p>

        <h1 className="mb-6 max-w-[900px] text-balance font-display text-[2.375rem] font-medium leading-[1.02] tracking-[-0.025em] text-[#FFFDF8] [text-shadow:0_2px_24px_rgba(6,20,34,0.45)] sm:text-[3.5rem] lg:text-[5.25rem] lg:leading-none">
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

        <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
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
