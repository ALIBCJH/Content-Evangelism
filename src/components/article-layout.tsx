import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { topicHref, type Category } from '@/lib/content'
import type { RealRow } from '@/lib/rows'
import { scriptureRefs } from '@/lib/scripture'
import type { Heading } from '@/lib/toc'
import { ArticleContents } from '@/components/article-contents'
import { ArticleRail } from '@/components/article-rail'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ContinueReading } from '@/components/continue-reading'
import { ReadingProgress } from '@/components/progress-bar'
import { ShareRow } from '@/components/share-row'

/**
 * One article page, for every article.
 *
 * The design sets it in two parts. First a cream band: the breadcrumb, the
 * headline and its standfirst on the left, the photograph on the right —
 * so a reader knows what the piece is and what it looks like before
 * scrolling at all. Then the reading column, 760px wide, with a 280px rail
 * beside it carrying the chapters and the Scriptures the teaching rests on.
 *
 * Two routes render a teaching — the posted articles at /articles/[slug]
 * and the hand-set piece at /articles/the-cross-of-jesus — and both are
 * this shell, so a change to how a teaching is presented is made once.
 */

export interface ArticleLayoutProps {
  category: Category
  title: string
  /** The standfirst: what this teaching is about, in one or two sentences. */
  dek: string
  /** `href` is omitted for a byline with no author page behind it. */
  author: { name: string; href?: string }
  publishedAt: string
  readMinutes: number
  hero?: { src: string; alt: string; caption?: string }
  /** Chapters, for the rail and the in-flow contents list. */
  headings: Heading[]
  /** What to read next — see `relatedRows`. */
  related: RealRow[]
  /**
   * The teaching's own text, so the rail can list the Scriptures it cites.
   * Omitted when the body is not plain text (the hand-set article).
   */
  body?: string
  /** Overrides the derived list, for a teaching set in JSX rather than text. */
  scriptures?: string[]
  /** Set at the close, above the ornament: a scripture list, a note. */
  colophon?: React.ReactNode
  /** The body of the teaching. */
  children: React.ReactNode
}

export function ArticleLayout({
  category,
  title,
  dek,
  author,
  publishedAt,
  readMinutes,
  hero,
  headings,
  related,
  body,
  scriptures,
  colophon,
  children,
}: ArticleLayoutProps) {
  const refs = scriptures ?? scriptureRefs(body, 12)

  return (
    <>
      <ReadingProgress />

      <main>
        {/* ── The band ───────────────────────────────────────────── */}
        <section className="border-b border-rule bg-raised">
          <div className="shell pt-10">
            <Breadcrumbs
              className="mb-8"
              crumbs={[
                { name: 'Home', href: '/' },
                { name: 'Articles', href: '/articles' },
                { name: category, href: topicHref(category) },
              ]}
            />
          </div>

          <div className="shell grid items-end gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
            <div>
              <h1 className="mb-5 text-balance font-display text-[2.125rem] font-medium leading-[1.04] tracking-[-0.02em] text-navy sm:text-[2.75rem] lg:text-[3.5rem]">
                {title}
              </h1>
              <p className="mb-6 text-pretty font-display text-[1.1875rem] leading-[1.45] text-ink-700 sm:text-[1.375rem]">
                {dek}
              </p>
              <p className="font-mono text-[0.6875rem] tracking-[0.06em] text-ink-subtle">
                {author.href ? (
                  <Link
                    href={author.href}
                    rel="author"
                    className="transition-colors hover:text-gold"
                  >
                    {author.name}
                  </Link>
                ) : (
                  <span>{author.name}</span>
                )}
                <span aria-hidden className="mx-2">·</span>
                <time dateTime={publishedAt}>
                  {format(parseISO(publishedAt), 'd MMMM yyyy')}
                </time>
                <span aria-hidden className="mx-2">·</span>
                <span className="tabular">{readMinutes} MIN READ</span>
              </p>
            </div>

            {hero && (
              <figure className="m-0">
                <div className="relative aspect-[3/2] overflow-hidden rounded-panel bg-navy-deep">
                  <Image
                    src={hero.src}
                    /* What the photograph shows — not the headline again,
                       which tells a screen reader and image search nothing
                       the h1 above has not already said. */
                    alt={hero.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {hero.caption && (
                  <figcaption className="mt-3 text-xs leading-snug text-ink-subtle">
                    {hero.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </div>
        </section>

        {/* ── The reading column ─────────────────────────────────── */}
        <div className="shell grid gap-12 pb-24 pt-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-[72px]">
          <article className="max-w-measure">
            {/* The chapter list, for every width the rail does not reach. */}
            <ArticleContents
              headings={headings}
              className="mb-10 rounded-panel border border-rule bg-card px-6 py-5 lg:hidden"
            />

            {children}

            <div className="mt-16 border-t border-rule pt-8">
              {colophon}
              <div className="ornament mx-auto mt-8 max-w-xs">
                <span aria-hidden className="text-base leading-none">✦</span>
              </div>
              <ShareRow title={title} className="mt-8" />
              <p className="mt-10 text-center">
                <Link
                  href="/articles"
                  className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:text-gold"
                >
                  ← ALL ARTICLES
                </Link>
              </p>
            </div>

            <ContinueReading rows={related} category={category} />
          </article>

          <div className="hidden lg:block">
            <ArticleRail headings={headings} scriptures={refs} />
          </div>
        </div>
      </main>
    </>
  )
}
