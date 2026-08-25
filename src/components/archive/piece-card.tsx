'use client'

import * as React from 'react'
import { Posted } from '@/components/posted'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'

/**
 * A piece in the column beside the lead: what it is, what it is called,
 * and the passage it stands on.
 *
 * Set as a stack of small cards rather than as the archive's wide rows,
 * because this column is scanned rather than read — a reader running down
 * it is looking for a title, and everything else on the card is there to
 * tell them whether to stop.
 */
export function PieceCard({
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
    <article className="card card-interactive relative p-5">
      <p className="kicker text-ink-subtle">
        <Posted iso={item.publishedAt} dated={item.dated} /> · {item.category} ·{' '}
        <span className="tabular">{item.readMinutes}</span> min
      </p>

      <h3 className="mt-2.5 text-pretty font-apparatus text-[1.0625rem] font-bold leading-[1.25] tracking-[-0.012em] text-navy">
        <Link href={item.href} data-track="read-article" className="focus-ring">
          {/* The whole card follows the headline, so the small print on it
              stays reachable rather than sitting inside a link. */}
          <span className="absolute inset-0" aria-hidden />
          <span className="headline-link">{item.title}</span>
        </Link>
      </h3>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        {item.refs[0] ? (
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-gold-ink">
            {item.refs[0]}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={ready ? saved : undefined}
          className="focus-ring relative z-10 shrink-0 text-[0.8125rem] text-ink-muted transition-colors hover:text-gold-ink"
        >
          {ready && saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  )
}
