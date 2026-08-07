import * as React from 'react'
import Link from 'next/link'

/**
 * The stage a section stands on before it opens.
 *
 * A full-bleed navy block against the linen page, carrying the section name
 * and then COMING SOON at a size that cannot be misread. The reader should
 * know what this page is and that it is not ready without reading a word of
 * body copy.
 *
 * Gold is paint here rather than ink — the block is navy, which is the one
 * ground the bright gold is allowed on (see globals.css).
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
  /** One line on what this section will hold. */
  blurb: string
  verse: string
  reference: string
}) {
  return (
    <main>
      {/* ── The stage ────────────────────────────────────────────── */}
      <section className="on-navy bg-navy">
        <div className="shell py-16 text-center sm:py-20 md:py-28">
          <p className="kicker mb-4 font-semibold text-gold">{kicker}</p>

          <h1 className="font-display text-[2rem] font-light leading-[1.06] tracking-[-0.02em] text-linen sm:text-[2.5rem]">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-md font-display text-base font-light italic leading-[1.5] text-sky sm:text-lg">
            {blurb}
          </p>

          {/* The announcement. Set on two lines at every width so it reads
              as a monument rather than a sentence, and so the longest word
              — not the phrase — decides how large it can be. */}
          <p
            aria-label="Coming soon"
            className="mt-10 font-display text-[clamp(2.75rem,14vw,9rem)] font-light uppercase leading-[0.9] tracking-[0.02em] text-linen sm:mt-12"
          >
            <span className="block">Coming</span>
            <span className="block text-gold">Soon</span>
          </p>

          <div className="ornament mx-auto mt-10 max-w-[16rem] sm:mt-12">
            <span aria-hidden className="text-base leading-none">
              ✦
            </span>
          </div>

          <blockquote className="mx-auto mt-8 max-w-lg">
            <p className="font-display text-lg font-light italic leading-[1.5] text-linen sm:text-xl">
              “{verse}”
            </p>
            <cite className="mt-4 block font-sans text-[0.6875rem] font-medium uppercase not-italic tracking-[0.19em] text-gold">
              {reference}
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ── Where to go instead ──────────────────────────────────────
          The ways out live on linen rather than inside the stage. That
          keeps the navy block purely the announcement, and gives the page
          a paper footing between two navy fields — otherwise the strip
          above the site footer reads as a gap rather than a section. */}
      <div className="shell py-16 text-center md:py-20">
        <Link
          href="/"
          className="focus-ring inline-block rounded-full bg-navy px-8 py-3 font-sans text-[0.8125rem] font-medium tracking-[0.04em] text-linen transition-colors hover:bg-navy-900"
        >
          Read what is published
        </Link>
        <p className="mt-6">
          <Link
            href="/search"
            className="border-b border-gold-ink pb-0.5 font-sans text-[0.8125rem] font-medium tracking-[0.05em] text-gold transition-colors hover:text-ink"
          >
            Search the whole archive
          </Link>
        </p>
      </div>
    </main>
  )
}
