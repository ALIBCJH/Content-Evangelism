import * as React from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { categoryBlurb, topicHref, type Category } from '@/lib/content'
import type { RealRow } from '@/lib/rows'

/**
 * The two ways out of a finished teaching.
 *
 * Up first: the section the piece belongs to, which is the broader
 * subject and the page that gathers everything else filed under it.
 * Then sideways: the pieces to read next, the same section before the
 * rest.
 *
 * Both are set as archive rows rather than as cards, because that is
 * what a listing looks like everywhere else on this site — the foot of an
 * article should read as more of the publication, not as a recommendation
 * strip bolted to the bottom of it.
 */
export function ContinueReading({
  rows,
  category,
}: {
  rows: RealRow[]
  category: Category
}) {
  return (
    <section className="mt-16 border-t border-hairline-strong pt-10">
      {/* ── Upward: the section this teaching belongs to ─────────── */}
      <h2 className="kicker text-gold">Explore the topic</h2>
      <Link
        href={topicHref(category)}
        className="focus-ring group mt-4 block border-b border-hairline pb-8"
      >
        <span className="flex items-baseline gap-3">
          <span className="font-display text-[1.6rem] font-normal leading-tight text-ink-strong transition-colors group-hover:text-gold-ink">
            <span className="headline-link">{category}</span>
          </span>
          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 translate-y-px text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-gold"
          />
        </span>
        <span className="mt-2 block max-w-prose font-serif text-[1.0625rem] leading-[1.6] text-ink-muted">
          {categoryBlurb[category]}
        </span>
      </Link>

      {/* ── Sideways: what to read next ──────────────────────────── */}
      {rows.length > 0 && (
        <>
          <h2 className="kicker mt-10 text-gold">Continue reading</h2>
          <ul className="mt-4">
            {rows.map((row) => (
              <li key={row.slug}>
                <Link
                  href={row.href}
                  className="piece focus-ring -mx-4 block border-b border-hairline px-4 py-6 last:border-b-0"
                >
                  <span
                    data-shift="lead"
                    className="block font-display text-[1.3rem] font-normal leading-[1.2] text-ink-strong"
                  >
                    <span className="headline-link">{row.title}</span>
                  </span>
                  <span
                    data-shift="trail"
                    className="mt-2 block font-serif text-[1.0625rem] leading-[1.55] text-ink-muted line-clamp-2"
                  >
                    {row.dek}
                  </span>
                  <span
                    data-shift="trail"
                    className="mt-3 block font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle"
                  >
                    <span className="text-gold">{row.category}</span>
                    <span aria-hidden className="mx-2">·</span>
                    <time dateTime={row.publishedAt}>
                      {format(parseISO(row.publishedAt), 'd MMM yyyy')}
                    </time>
                    <span aria-hidden className="mx-2">·</span>
                    <span className="tabular">{row.readMinutes} min read</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
