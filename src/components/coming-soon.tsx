import * as React from 'react'
import Link from 'next/link'

/**
 * The banner a section carries before it opens.
 *
 * Built to be looked at rather than apologised for: the section is named at
 * full display size on cloth, a gold ornament divides it from a line of
 * scripture, and one navy button sends the reader somewhere that is ready.
 */
export function ComingSoon({
  kicker,
  title,
  blurb,
  verse,
  reference,
}: {
  kicker: string
  title: string
  /** One or two sentences on what this section will hold. */
  blurb: string
  verse: string
  reference: string
}) {
  return (
    <main className="shell pb-8">
      <header className="pt-12 md:pt-16">
        <p className="kicker mb-4 text-ink-subtle">{kicker}</p>
        <h1 className="mb-4 font-display text-[2.4rem] font-light leading-[1.04] tracking-[-0.02em] text-ink-strong sm:text-[3rem] md:text-[3.4rem]">
          {title}
        </h1>
        <p className="mb-11 max-w-lg border-b border-thread pb-11 font-display text-lg font-light italic leading-[1.5] text-ink-muted sm:text-xl">
          {blurb}
        </p>
      </header>

      <article className="cloth px-6 py-14 text-center sm:px-12 md:py-20">
        {/* The label, set as a rule rather than as a badge. */}
        <p className="kicker mb-8 text-gold">Coming soon</p>

        <p className="mx-auto max-w-md font-display text-[1.75rem] font-light leading-[1.15] tracking-[-0.015em] text-ink-strong sm:text-[2.1rem]">
          This desk is being prepared.
        </p>

        <div className="ornament mx-auto my-9 max-w-[14rem]">
          <span aria-hidden className="text-base leading-none">
            ✦
          </span>
        </div>

        <blockquote className="mx-auto max-w-lg">
          <p className="font-display text-lg font-light italic leading-[1.5] text-ink-muted sm:text-xl">
            “{verse}”
          </p>
          <cite className="mt-4 block font-sans text-[0.6875rem] font-medium uppercase not-italic tracking-[0.19em] text-gold">
            {reference}
          </cite>
        </blockquote>

        <div className="mt-11">
          <Link
            href="/"
            className="focus-ring inline-block rounded-full bg-navy px-8 py-3 font-sans text-[0.8125rem] font-medium tracking-[0.04em] text-linen transition-colors hover:bg-navy-900"
          >
            Read what is published
          </Link>
        </div>
      </article>

      <div className="mt-8 border-t border-thread py-14 text-center">
        <Link
          href="/search"
          className="border-b border-gold-ink pb-0.5 font-sans text-[0.8125rem] font-medium tracking-[0.05em] text-gold transition-colors hover:text-ink"
        >
          Search the whole archive
        </Link>
      </div>
    </main>
  )
}
