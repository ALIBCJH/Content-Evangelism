import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { RealRow } from '@/lib/rows'
import { dateline } from '@/lib/search-docs'
import { primaryRef } from '@/lib/scripture'

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
 * One row of the archive: the thumbnail, the section it is filed under,
 * the headline, its opening line, and the dateline.
 *
 * The whole row is the link. The excerpt is clamped to three lines so
 * every row is the same height and the page reads as a list to choose
 * from rather than a stack of part-articles.
 */
export function ArticleRow({ row }: { row: RealRow }) {
  const ref = primaryRef(row.body) ?? row.category

  return (
    <Link
      href={row.href}
      className="piece group flex items-start gap-4 border-b border-rule py-7 last:border-b-0 sm:gap-7"
    >
      {row.imageUrl && (
        <span className="relative block aspect-[4/3] w-[92px] shrink-0 overflow-hidden rounded-tile bg-rule-soft sm:w-[clamp(120px,18vw,170px)]">
          <Image
            src={row.imageUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 170px, 92px"
            className="object-cover"
          />
        </span>
      )}

      <span className="block min-w-0 flex-1">
        <span className="kicker mb-3 block text-gold">{row.category}</span>

        <span className="mb-3 block text-balance font-display text-[1.25rem] font-medium leading-[1.16] text-navy sm:text-[1.8125rem]">
          <span className="headline-link">{row.title}</span>
        </span>

        <span className="mb-3.5 max-w-[660px] text-[0.9375rem] leading-[1.7] text-ink-muted line-clamp-3">
          {openingLine(row.body, row.dek)}
        </span>

        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.625rem] text-ink-subtle">
          <time dateTime={row.publishedAt}>{dateline(row.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span className="tabular">{row.readMinutes} MIN</span>
          <span aria-hidden>·</span>
          <span>{ref}</span>
          <span className="ms-1.5 text-navy transition-colors group-hover:text-gold">READ →</span>
        </span>
      </span>
    </Link>
  )
}
