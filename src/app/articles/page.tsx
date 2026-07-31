import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { Flame } from 'lucide-react'
import {
  articles as seedArticles,
  authorById,
  categoryArt,
  categoryMeta,
  crossArticle,
  type ArticleArt as ArticleArtSpec,
} from '@/lib/content'
import { listPostedArticles } from '@/lib/posted'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ArticleArt } from '@/components/article-art'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Articles',
  description: 'All articles from the publication desk of the Ministry of Repentance and Holiness.',
  alternates: { canonical: '/articles' },
}

export const dynamic = 'force-dynamic'

interface Row {
  key: string
  href: string
  title: string
  dek: string
  category: string
  authorName: string
  publishedAt: string
  readMinutes: number
  imageUrl?: string
  art: ArticleArtSpec
}

function ago(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
}

function Thumb({ row, className }: { row: Row; className: string }) {
  return row.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={row.imageUrl} alt="" className={`${className} object-cover`} />
  ) : (
    <ArticleArt art={row.art} className={className} sealClassName="h-11 w-11" iconClassName="h-5 w-5" />
  )
}

function Meta({ row, className = '' }: { row: Row; className?: string }) {
  return (
    <p className={`font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle ${className}`}>
      {row.category}
      <span aria-hidden className="mx-1.5 text-gold">·</span>
      {ago(row.publishedAt)}
    </p>
  )
}

export default async function ArticlesPage() {
  const posted = await listPostedArticles()

  const real: Row[] = [
    ...posted.map((a) => ({
      key: a.slug,
      href: `/articles/${a.slug}`,
      title: a.title,
      dek: a.dek,
      category: a.category as string,
      authorName: a.authorName,
      publishedAt: a.publishedAt,
      readMinutes: a.readMinutes,
      imageUrl: a.imageUrl,
      art: categoryArt[a.category],
    })),
    {
      key: crossArticle.slug,
      href: crossArticle.href!,
      title: crossArticle.title,
      dek: crossArticle.dek,
      category: crossArticle.category,
      authorName: 'The Editorial Desk',
      publishedAt: crossArticle.publishedAt,
      readMinutes: crossArticle.readMinutes,
      imageUrl: crossArticle.image?.src,
      art: crossArticle.art,
    },
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  // Seed pieces keep the page full while the archive is young; they fall
  // off the bottom as real articles are published. They have no page of
  // their own yet, so each links to its section rather than nowhere.
  const fill: Row[] = seedArticles.map((a) => ({
    key: a.slug,
    href: `/category/${categoryMeta[a.category].slug}`,
    title: a.title,
    dek: a.dek,
    category: a.category,
    authorName: authorById(a.authorId).name,
    publishedAt: a.publishedAt,
    readMinutes: a.readMinutes,
    art: a.art,
  }))

  const rows = [...real, ...fill]
  const [lead, ...rest] = rows
  const secondary = rest.slice(0, 3)
  const trending = rest.slice(3, 8)
  const grid = rest.slice(8)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 md:pb-28 lg:px-8">
        {/* ── Slim section label ─────────────────────────────── */}
        <div className="flex items-baseline justify-between border-b-2 border-hairline-strong pb-3">
          <h1 className="font-display text-2xl font-semibold text-ink-strong md:text-3xl">Articles</h1>
          <p className="kicker hidden text-ink-subtle sm:block">The reading room · newest first</p>
        </div>

        {/* ── Lead story + trending rail ─────────────────────── */}
        <div className="col-rules mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-0">
          <div className="lg:col-span-8 lg:pr-10">
            <Link href={lead.href} className="group block">
              <Thumb row={lead} className="aspect-[16/9] w-full rounded-2xl border border-hairline" />
              <div className="mt-5">
                <Badge variant="gold" size="sm">{lead.category}</Badge>
                <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.15] tracking-tight text-ink-strong md:text-4xl">
                  <span className="headline-link">{lead.title}</span>
                </h2>
                <p className="mt-3 max-w-2xl font-serif text-base leading-relaxed text-ink-muted md:text-lg">
                  {lead.dek}
                </p>
                <p className="mt-4 font-sans text-xs text-ink-subtle">
                  <span className="font-semibold text-ink-muted">{lead.authorName}</span>
                  <span aria-hidden className="mx-2">·</span>
                  {ago(lead.publishedAt)}
                  <span aria-hidden className="mx-2">·</span>
                  <span className="tabular">{lead.readMinutes} min read</span>
                </p>
              </div>
            </Link>
          </div>

          <aside className="lg:col-span-4 lg:pl-10" aria-label="Trending">
            <div className="flex items-center gap-2 border-b border-hairline-strong pb-3">
              <Flame className="h-4 w-4 text-gold" />
              <p className="kicker text-ink">Trending now</p>
            </div>
            <ol className="divide-y divide-hairline">
              {trending.map((row, index) => (
                <li key={row.key}>
                  <Link href={row.href} className="group flex gap-4 py-4">
                    <span
                      aria-hidden
                      className="font-display text-2xl font-semibold leading-none text-gold/70 transition-colors group-hover:text-gold"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[0.98rem] font-semibold leading-snug text-ink transition-colors group-hover:text-ink-strong">
                        {row.title}
                      </span>
                      <Meta row={row} className="mt-1.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {/* ── Secondary row ──────────────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-hairline pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {secondary.map((row) => (
            <Link key={row.key} href={row.href} className="group block">
              <Thumb row={row} className="aspect-[16/10] w-full rounded-xl border border-hairline" />
              <Badge variant="outline" size="sm" className="mt-4">{row.category}</Badge>
              <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ink-strong">
                <span className="headline-link">{row.title}</span>
              </h3>
              <p className="mt-2 font-serif text-sm leading-relaxed text-ink-muted line-clamp-2">
                {row.dek}
              </p>
              <Meta row={row} className="mt-3" />
            </Link>
          ))}
        </div>

        {/* ── More stories grid ──────────────────────────────── */}
        {grid.length > 0 && (
          <>
            <div className="mt-14 flex items-center gap-3 border-b border-hairline-strong pb-3">
              <p className="kicker text-gold">More stories</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {grid.map((row) => (
                <Link key={row.key} href={row.href} className="group block">
                  <Thumb row={row} className="aspect-[16/10] w-full rounded-xl border border-hairline" />
                  <h3 className="mt-4 font-display text-[1.05rem] font-semibold leading-snug text-ink">
                    <span className="headline-link">{row.title}</span>
                  </h3>
                  <Meta row={row} className="mt-2" />
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
