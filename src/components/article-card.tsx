import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import type { ArticleArt as ArticleArtSpec } from '@/lib/content'
import { ArticleArt } from '@/components/article-art'

export function ago(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
}

/** The fields a story card needs — RealRow and the listing-page rows both satisfy it. */
export interface CardRow {
  href: string
  title: string
  dek: string
  category: string
  publishedAt: string
  imageUrl?: string
  art: ArticleArtSpec
}

/** Cover image for a card; falls back to the article's house art plate. */
export function CardImage({
  row,
  className,
  sealClassName = 'h-11 w-11',
  iconClassName = 'h-5 w-5',
}: {
  row: Pick<CardRow, 'imageUrl' | 'art'>
  className: string
  sealClassName?: string
  iconClassName?: string
}) {
  return row.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={row.imageUrl} alt="" className={`${className} object-cover`} />
  ) : (
    <ArticleArt art={row.art} className={className} sealClassName={sealClassName} iconClassName={iconClassName} />
  )
}

/**
 * Newsfeed story card: the related image leads, a few lines follow, and a
 * "Read More" caption closes it — the pattern mobile news readers know.
 */
export function ArticleCard({ row, showDek = true }: { row: CardRow; showDek?: boolean }) {
  return (
    <Link href={row.href} className="group block">
      <CardImage row={row} className="aspect-[16/10] w-full rounded-xl border border-hairline" />
      <p className="mt-4 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
        {row.category}
        <span aria-hidden className="mx-1.5 text-gold">·</span>
        {ago(row.publishedAt)}
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink-strong">
        <span className="headline-link">{row.title}</span>
      </h3>
      {showDek && (
        <p className="mt-2 font-serif text-sm leading-relaxed text-ink-muted line-clamp-2">
          {row.dek}
        </p>
      )}
      <p className="mt-3 inline-flex items-center gap-1.5 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-gold">
        Read More
        <ArrowRight aria-hidden className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </p>
    </Link>
  )
}
