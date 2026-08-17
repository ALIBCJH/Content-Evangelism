'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import { QuotePlate } from '@/components/archive/quote-plate'
import { SaveButton } from '@/components/archive/save-button'

/**
 * One piece below the lead: the same two-part card, set quieter.
 *
 * The plate is narrower and its kicker is the reference rather than the
 * words "key text" — on a row the label has to earn its line, and the
 * reference is the thing a reader is scanning for.
 */
export function PieceRow({
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
    <article className="card card-interactive group relative h-full overflow-hidden sm:grid sm:grid-cols-[minmax(0,34%)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,36%)_minmax(0,1fr)]">
      <QuotePlate
        item={item}
        label={item.quote?.cite ?? item.category}
        className="min-h-[180px] sm:min-h-[240px]"
      />

      <div className="flex min-w-0 flex-col p-5 sm:p-7">
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
            {item.category}
          </span>
          <time
            dateTime={item.publishedAt}
            className="font-mono text-[0.6875rem] tracking-[0.08em] text-ink-subtle"
          >
            {item.dated} · <span className="tabular">{item.readMinutes}</span> MIN
          </time>
          <span className="ml-auto">
            <SaveButton saved={saved} ready={ready} onToggle={onToggle} title={item.title} compact />
          </span>
        </div>

        <h3 className="mb-3 text-balance font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.75rem]">
          <Link href={item.href} className="focus-ring rounded-sm before:absolute before:inset-0 before:z-0">
            <span className="headline-link">{item.title}</span>
          </Link>
        </h3>

        <p className="mb-5 line-clamp-2 max-w-[62ch] text-[0.9375rem] leading-[1.7] text-ink-muted">
          {item.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4">
          <span className="flex flex-wrap gap-2">
            {item.refs.map((ref) => (
              <span
                key={ref}
                className="rounded-chip bg-chip px-3 py-1.5 font-mono text-xs text-ink-700"
              >
                {ref}
              </span>
            ))}
          </span>
          <Link
            href={item.href}
            data-track="read-article"
            className="focus-ring relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-tile bg-gold px-5 py-2.5 text-[0.875rem] font-semibold text-plate-deep transition-colors hover:bg-gold-light"
          >
            Read article <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
