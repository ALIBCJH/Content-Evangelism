import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import type { RealRow } from '@/lib/rows'
import { ArticleCard } from '@/components/article-card'
import { SectionHeading } from '@/components/section-heading'
import { FadeIn } from '@/components/motion'

/**
 * Latest Articles strip below the fold. Shows only real pieces; while the
 * archive is young, a reading-room card completes the row instead of filler.
 */
export function LatestStrip({ rows }: { rows: RealRow[] }) {
  if (rows.length === 0) return null
  const needsCta = rows.length < 3

  return (
    <section aria-label="Latest articles" className="mx-auto max-w-7xl border-t border-hairline px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <SectionHeading
        kicker="Fresh from the desk"
        title="Latest Articles"
        href="/articles"
        hrefLabel="The reading room"
      />
      <FadeIn>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.slice(0, 3).map((row) => (
            <ArticleCard key={row.slug} row={row} />
          ))}
          {needsCta && (
            <Link
              href="/articles"
              className="group grid min-h-[16rem] place-items-center rounded-xl border border-dashed border-hairline-strong p-8 text-center transition-colors hover:border-gold/50"
            >
              <span>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10">
                  <BookOpen className="h-5 w-5 text-gold" strokeWidth={1.5} />
                </span>
                <span className="mt-4 block font-display text-lg font-semibold text-ink-strong">
                  The reading room is open
                </span>
                <span className="mt-2 block font-serif text-sm text-ink-muted">
                  Browse everything the desk has published.
                </span>
                <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker text-gold">
                  All articles
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          )}
        </div>
      </FadeIn>
    </section>
  )
}
