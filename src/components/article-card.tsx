import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import type { RealRow } from '@/lib/rows'
import { ArticleArt } from '@/components/article-art'
import { Badge } from '@/components/ui/badge'

export function ago(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
}

/** Standard story card: thumb, category, headline, dek, relative time. */
export function ArticleCard({ row, showDek = true }: { row: RealRow; showDek?: boolean }) {
  return (
    <Link href={row.href} className="group block">
      {row.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.imageUrl}
          alt=""
          className="aspect-[16/10] w-full rounded-xl border border-hairline object-cover"
        />
      ) : (
        <ArticleArt
          art={row.art}
          className="aspect-[16/10] w-full rounded-xl border border-hairline"
          sealClassName="h-11 w-11"
          iconClassName="h-5 w-5"
        />
      )}
      <Badge variant="outline" size="sm" className="mt-4">{row.category}</Badge>
      <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ink-strong">
        <span className="headline-link">{row.title}</span>
      </h3>
      {showDek && (
        <p className="mt-2 font-serif text-sm leading-relaxed text-ink-muted line-clamp-2">
          {row.dek}
        </p>
      )}
      <p className="mt-3 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
        {row.authorName}
        <span aria-hidden className="mx-1.5 text-gold">·</span>
        {ago(row.publishedAt)}
      </p>
    </Link>
  )
}
