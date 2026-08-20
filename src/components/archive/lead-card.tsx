'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bookmark, Volume2 } from 'lucide-react'
import type { ArchiveItem } from '@/lib/archive-items'

/**
 * The piece at the head of the archive, given the room to be one.
 *
 * What a reader decides on is here in the order they decide in: what it
 * is filed under, when it was written and how long it takes, the question
 * it answers, the two sentences under that, and the ground it stands on —
 * the passages, as chips, which are the fastest way to know whether a
 * teaching is about the thing you came for.
 *
 * There is no "read article" button, because there is nothing to go to:
 * the teaching itself carries on below this card as the reader scrolls.
 * What is left are the two things scrolling does not do — being read to,
 * and putting the piece aside for later.
 */
export function LeadCard({
  item,
  saved,
  ready,
  onToggle,
  onListen,
  listening,
}: {
  item: ArchiveItem
  saved: boolean
  ready: boolean
  onToggle: () => void
  onListen: () => void
  listening: boolean
}) {
  return (
    <article className="card card-glow card-glow-lead relative p-6 sm:p-8">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="kicker rounded-chip bg-chip-gold px-2.5 py-1 text-gold-ink">
          {item.category}
        </span>
        <span className="kicker text-ink-subtle">
          {item.dated} · <span className="tabular">{item.readMinutes}</span> min
        </span>
      </p>

      <h2 className="mt-4 text-balance font-article text-[1.75rem] font-normal leading-[1.12] text-navy sm:text-[2.125rem]">
        <Link href={item.href} data-track="read-article" className="focus-ring">
          <span className="headline-link">{item.title}</span>
        </Link>
      </h2>

      <p className="mt-4 max-w-[36rem] text-pretty text-[1.0625rem] leading-[1.65] text-ink-700">
        {item.dek}
      </p>

      {item.refs.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {item.refs.map((ref) => (
            <li key={ref}>
              {/* A passage is a question a reader might follow, so it is a
                  link rather than a label: it searches the archive for
                  everything else standing on the same ground. */}
              <Link
                href={`/search?q=${encodeURIComponent(ref)}`}
                className="focus-ring block rounded-chip bg-surface-2 px-3 py-1.5 font-mono text-[0.75rem] tracking-[0.02em] text-ink-700 transition-colors hover:bg-chip-gold hover:text-gold-ink"
              >
                {ref}
              </Link>
            </li>
          ))}
          {item.moreRefs > 0 && (
            <li className="self-center font-mono text-[0.75rem] text-ink-subtle">
              +{item.moreRefs}
            </li>
          )}
        </ul>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <button
          type="button"
          onClick={onListen}
          aria-pressed={listening}
          className="focus-ring inline-flex items-center gap-2 rounded-chip bg-plate px-5 py-2.5 text-[0.9375rem] font-semibold text-plate-pale transition-colors hover:bg-plate-deep"
        >
          <Volume2 aria-hidden className="h-4 w-4" />
          {listening ? 'Listening' : 'Listen'}
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={ready ? saved : undefined}
          className="focus-ring inline-flex items-center gap-2 rounded-chip border border-rule px-4 py-2.5 text-[0.9375rem] text-ink transition-colors hover:border-gold/60 hover:text-gold-ink"
        >
          <Bookmark
            aria-hidden
            className={`h-4 w-4 ${ready && saved ? 'fill-gold text-gold' : ''}`}
          />
          {ready && saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  )
}
