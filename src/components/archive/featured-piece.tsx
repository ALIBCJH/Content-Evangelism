'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import { QuotePlate } from '@/components/archive/quote-plate'
import { SaveButton } from '@/components/archive/save-button'

/**
 * The piece at the head of the archive, given the room to be read as a
 * front page rather than as the first of a list.
 *
 * The plate stands beside it at full height, which is the composition the
 * design sets: the passage on the left, what the teaching does with it on
 * the right. Below `lg` the two stack, because a 38% column of navy on a
 * phone is a stripe.
 */
export function FeaturedPiece({
  item,
  saved,
  ready,
  onToggle,
}: {
  item: ArchiveItem
  saved: boolean
  ready: boolean
  onToggle: () => void
}) {
  return (
    <article className="card card-interactive group relative overflow-hidden lg:grid lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] xl:grid-cols-[minmax(0,30%)_minmax(0,1fr)]">
      <QuotePlate item={item} mark className="min-h-[220px] lg:min-h-[340px]" />

      <div className="flex min-w-0 flex-col p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <span className="kicker inline-flex items-center gap-1.5 rounded-chip bg-chip-gold px-2.5 py-1 text-gold-ink">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
            Latest
          </span>
          <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
            {item.category}
          </span>
          <time
            dateTime={item.publishedAt}
            className="font-mono text-[0.6875rem] tracking-[0.08em] text-ink-subtle"
          >
            {item.dated} · <span className="tabular">{item.readMinutes}</span> MIN READ
          </time>
        </div>

        <h2 className="mb-4 text-balance font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.375rem] xl:text-[2.75rem]">
          {/* The whole card is the link; the heading is where it is
              announced, and the overlay is what makes the rest of the
              card clickable without nesting anything inside an anchor. */}
          <Link href={item.href} className="focus-ring rounded-sm before:absolute before:inset-0 before:z-0">
            <span className="headline-link">{item.title}</span>
          </Link>
        </h2>

        <p className="mb-5 max-w-[62ch] text-pretty text-[1.0625rem] leading-[1.65] text-ink-700">
          {item.dek}
        </p>

        {item.refs.length > 0 && (
          <div className="mb-7 flex flex-wrap gap-2">
            {item.refs.map((ref) => (
              <span
                key={ref}
                className="rounded-chip bg-chip px-3 py-1.5 font-mono text-xs text-ink-700"
              >
                {ref}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-rule-soft pt-6">
          <Link
            href={item.href}
            data-track="read-article"
            className="focus-ring relative z-10 inline-flex items-center gap-2 rounded-tile bg-cta px-6 py-3 text-[0.9375rem] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
          >
            Read article <span aria-hidden>→</span>
          </Link>

          <SaveButton saved={saved} ready={ready} onToggle={onToggle} title={item.title} />

          <span className="kicker ml-auto hidden text-ink-subtle sm:block">{item.authorName}</span>
        </div>
      </div>
    </article>
  )
}
