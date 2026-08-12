import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { RealRow } from '@/lib/rows'
import { dateline } from '@/lib/search-docs'
import { scriptureRefs } from '@/lib/scripture'

/**
 * The featured piece: the teaching set beside its photograph, at the head
 * of the front page and again at the head of the articles index.
 *
 * The whole card is one link. On a phone the photograph leads and the text
 * follows it; from `md` up they sit side by side with the text on the left,
 * exactly as the design sets them.
 */
export function FeaturedArticle({
  row,
  kind = 'Article',
  priority = false,
}: {
  row: RealRow
  /** The pill above the headline: "Article" on the front, "Featured" on the index. */
  kind?: 'Article' | 'Featured'
  priority?: boolean
}) {
  const refs = scriptureRefs(row.body, 4)
  const ref = refs[0] ?? row.category

  return (
    <Link
      href={row.href}
      className="card card-interactive group flex flex-col-reverse overflow-hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-stretch"
    >
      <div className="p-6 sm:p-9 lg:px-11 lg:py-12">
        <p className="mb-4 flex flex-wrap items-center gap-2.5">
          <span
            className={`kicker rounded-chip px-2.5 py-1.5 ${
              kind === 'Featured' ? 'bg-chip-gold text-gold-ink' : 'bg-chip-blue text-navy'
            }`}
          >
            {kind}
          </span>
          <span className="font-mono text-[0.6875rem] text-gold">{ref}</span>
        </p>

        <h3 className="mb-4 text-balance font-display text-[1.75rem] font-medium leading-[1.12] tracking-[-0.015em] text-navy sm:text-[2.125rem] lg:text-[2.5rem]">
          <span className="headline-link">{row.title}</span>
        </h3>

        <p className="mb-5 text-base leading-[1.7] text-ink-700">{row.dek}</p>

        {refs.length > 1 && (
          <p className="mb-6 flex flex-wrap gap-2">
            {refs.map((scripture) => (
              <span key={scripture} className="chip">
                {scripture}
              </span>
            ))}
          </p>
        )}

        <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-rule-soft pt-5 font-mono text-[0.6875rem] text-ink-subtle">
          <time dateTime={row.publishedAt}>{dateline(row.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span className="tabular">{row.readMinutes} MIN READ</span>
          <span aria-hidden>·</span>
          <span className="text-navy transition-colors group-hover:text-gold">READ ARTICLE →</span>
        </p>
      </div>

      <div className="relative min-h-[220px] bg-navy-deep sm:min-h-[300px] md:min-h-[420px]">
        {row.imageUrl && (
          <Image
            src={row.imageUrl}
            alt={row.imageAlt ?? ''}
            fill
            priority={priority}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
    </Link>
  )
}
