import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { RealRow } from '@/lib/rows'
import { dateline } from '@/lib/search-docs'
import { scriptureRefs } from '@/lib/scripture'

/** The opening line of a piece — what a reader sees in the listing. */
export function openingLine(body: string | undefined, dek: string): string {
  if (!body) return dek
  const first = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('## ') && !block.startsWith('> '))
  return first ?? dek
}

/**
 * One entry in the archive: the photograph, what the piece is and when it
 * was published, the headline, its opening line, and the Scriptures it
 * rests on.
 *
 * It is set as a card on the dated rail, in the same language as a
 * prophecy record — because it is the same kind of thing, and a reader
 * moving between the two archives should not have to learn the page
 * twice. What differs is what a teaching actually has that a recording
 * does not: a section, a reading time, and its Scriptures.
 *
 * The whole card is the link. The excerpt is clamped to three lines so
 * the page reads as a list to choose from rather than a stack of
 * part-articles.
 */
export function ArticleCard({
  row,
  /** The newest piece: labelled as such, and its photograph is eager. */
  latest = false,
}: {
  row: RealRow
  latest?: boolean
}) {
  const refs = scriptureRefs(row.body, 3)

  return (
    <Link
      href={row.href}
      className="card card-interactive group flex h-full flex-col items-start gap-6 p-5 sm:p-8 lg:flex-row lg:items-stretch lg:gap-7"
    >
      {/* On a phone the picture leads at 16:9. From `lg` it stands as a
          column beside the type and takes the card's full height, because
          a narrower card is a taller card, and a fixed 16:9 well left a
          third of that column empty. */}
      <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden rounded-tile border border-rule bg-navy-deep lg:aspect-auto lg:w-[240px]">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt=""
            fill
            priority={latest}
            sizes="(min-width: 1024px) 260px, 100vw"
            className="object-cover"
          />
        ) : (
          /* No photograph: the section, set on the ministry's navy. A
             plate that says what the piece is beats an empty well. */
          <span className="flex h-full w-full items-center justify-center px-4 text-center font-display text-[1.25rem] leading-tight text-gold-pale">
            {row.category}
          </span>
        )}
      </span>

      <span className="block min-w-0 flex-1">
        <span className="mb-3.5 flex flex-wrap items-center gap-3">
          <time
            dateTime={row.publishedAt}
            className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy"
          >
            {dateline(row.publishedAt)}
          </time>
          <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
            {row.category}
          </span>
          {latest && (
            <span className="kicker rounded-chip bg-chip-gold px-2.5 py-1 text-gold-ink">
              Latest
            </span>
          )}
        </span>

        <span className="mb-3.5 block text-balance font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.875rem]">
          <span className="headline-link">{row.title}</span>
        </span>

        {/* No `block` here: line-clamp needs `display: -webkit-box`, and a
            `block` alongside it silently wins and leaves the excerpt
            unclamped — which is what it had been doing. */}
        <span className="mb-4 line-clamp-3 max-w-[720px] text-[0.9375rem] leading-[1.7] text-ink-muted">
          {openingLine(row.body, row.dek)}
        </span>

        <span className="flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4">
          <span className="flex flex-wrap gap-2">
            {refs.map((scripture) => (
              <span
                key={scripture}
                className="rounded-chip bg-chip px-3 py-1.5 font-mono text-xs text-ink-700"
              >
                {scripture}
              </span>
            ))}
          </span>
          <span
            data-track="read-article"
            className="whitespace-nowrap font-mono text-[0.6875rem] text-navy transition-colors group-hover:text-gold"
          >
            <span className="tabular">{row.readMinutes} MIN</span> · READ ARTICLE →
          </span>
        </span>
      </span>
    </Link>
  )
}
