import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, BadgeCheck, CircleDashed } from 'lucide-react'
import { topicHref, type Category } from '@/lib/content'
import type { RealRow } from '@/lib/rows'
import { scriptureRefs } from '@/lib/scripture'
import type { Heading } from '@/lib/toc'
import { ArticleContents } from '@/components/article-contents'
import { ArticleRail, ChapterNav, ScriptureList } from '@/components/article-rail'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ContinueReading } from '@/components/continue-reading'
import { FulfilledNow } from '@/components/fulfilled-now'
import { ReadingProgress } from '@/components/progress-bar'
import { ShareRow } from '@/components/share-row'
import { buttonVariants } from '@/components/ui/button'

/**
 * One article page, for every article.
 *
 * The design sets it in two parts. First a cream band: the breadcrumb, the
 * headline and its standfirst on the left, the photograph on the right —
 * so a reader knows what the piece is and what it looks like before
 * scrolling at all. Then the reading column with a 280px rail beside it
 * carrying the chapters and the Scriptures the teaching rests on.
 *
 * From here down the page leaves the chrome's type behind and is set in
 * the reading layer: Newsreader for the headline and the standfirst,
 * Gentium for every word of the body, IBM Plex for the byline and the
 * rail. Serif for what you read, sans for what you scan. The column is
 * capped at --read rather than --measure, because 19px Gentium reaches 65
 * characters sooner than the chrome's text does.
 *
 * Every teaching is rendered through this shell, from /articles/[slug],
 * so a change to how a teaching is presented is made once.
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
  /**
   * Whether the desk has checked this teaching against the ministry's own
   * published teaching. The badge states either answer, because a page
   * that marks only what it has checked leaves a reader to guess what the
   * silence on every other page means.
   */
  verified?: boolean
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

/**
 * The tracks, shared by the band and the reading area.
 *
 * The headline used to sit at the shell's edge while the teaching below it
 * began 300px further in — two left margins on one page, with no relation
 * between them. Both hang off the same grid now, so the headline starts
 * where the chapters start and ends where the teaching ends.
 */
const TRACKS =
  'shell grid gap-12 lg:grid-cols-[minmax(0,var(--read))_280px] lg:justify-center lg:gap-x-[72px] xl:grid-cols-[240px_minmax(0,var(--read))_260px] xl:gap-x-14'

export function ArticleLayout({
  category,
  title,
  dek,
  author,
  publishedAt,
  readMinutes,
  verified,
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
          {/* One block across the whole grid. A teaching with no photograph
              had been laying its headline into a 1fr track beside an empty
              0.85fr one — half the band blank, and the headline broken over
              three lines to fit a column that was only narrow because of a
              picture that was never there. */}
          <div className={`${TRACKS} pb-11 pt-8`}>
            <div className="col-span-full">
              {/* The way back, at the head of the teaching rather than
                  only at its foot. A breadcrumb is a trail, and a reader
                  who wants the archive reads it as ornament — so the trail
                  keeps its job and the button says the thing plainly. */}
              <div className="mb-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <Breadcrumbs
                  crumbs={[
                    /* The archive is the front page, so "Home" and
                       "Articles" would be the same URL twice. One crumb. */
                    { name: 'Articles', href: '/' },
                    { name: category, href: topicHref(category) },
                  ]}
                />
                {/* Full size, not `sm`. This is the way out of a ten-minute
                    read, and at the small size it read as a caption sitting
                    next to the breadcrumb rather than as something to
                    press. */}
                <Link
                  href="/"
                  className={buttonVariants({ variant: 'outline', className: 'gap-2.5 px-7' })}
                >
                  <ArrowLeft aria-hidden />
                  All articles
                </Link>
              </div>

              {/* The photograph is what asks for two columns. Without one
                  there is nothing to sit beside, and the headline takes
                  the width. */}
              <div
                className={
                  hero
                    ? 'grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-14'
                    : ''
                }
              >
                <div>
                  {/* Whether the desk has checked the teaching, said before
                      the teaching rather than after it. Green is the site's
                      fulfilled colour and carries the same meaning here —
                      this was looked at and it holds. The unchecked state is
                      grey and deliberately quiet: it reports that no one has
                      been through the piece yet, which is not an accusation
                      against it. */}
                  <p className="mb-4">
                    <span
                      title={
                        verified
                          ? "Checked by the editorial desk against the ministry's published teaching."
                          : 'Not yet checked by the editorial desk.'
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-apparatus text-[0.6875rem] font-medium uppercase tracking-[0.08em] ${
                        verified
                          ? 'border-fulfilled/35 bg-fulfilled/10 text-fulfilled'
                          : 'border-rule bg-card text-ink-subtle'
                      }`}
                    >
                      {verified ? (
                        <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                      ) : (
                        <CircleDashed aria-hidden className="h-3.5 w-3.5" />
                      )}
                      {verified ? 'Verified' : 'Not verified'}
                    </span>
                  </p>
                  {/* 300, not 500. Large serif at a heavy weight shouts; at
                      300 the same words are unhurried. The negative tracking
                      pulls a loose-by-default large serif into one shape. */}
                  <h1 className="mb-4 text-balance font-article text-[2.125rem] font-light leading-[1.08] tracking-[-0.018em] text-navy sm:text-[2.75rem] lg:text-[3.5rem]">
                    {title}
                  </h1>
                  {/* The standfirst keeps a measure of its own. A headline
                      can run the width of the page; two sentences of italic
                      cannot. */}
                  <p className="mb-5 max-w-[44rem] text-pretty font-article text-[1.1875rem] font-light italic leading-[1.45] text-ink-700 sm:text-[1.375rem]">
                    {dek}
                  </p>
                  <p className="font-apparatus text-[0.75rem] tracking-[0.06em] text-ink-subtle">
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
                        /* What the photograph shows — not the headline
                           again, which tells a screen reader and image
                           search nothing the h1 above has not already
                           said. */
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
            </div>
          </div>
        </section>

        {/* ── The reading column ─────────────────────────────────── */}
        {/* Three columns where there is room for three: where you are in
            the teaching on the left, the teaching itself in the middle at
            the measure it should be read at, and what it rests on to the
            right. The reading column is tracked at --read rather than 1fr
            because 34rem is the measure whatever the screen does; what a
            wider screen buys is not a longer line but somewhere to put the
            apparatus, and a column that sits in the middle of the page
            rather than against its left edge.

            One screen down there is room for one rail, and it carries both
            halves stacked. Below that the rails fold into the contents
            list at the head of the article. In every case the tracks are
            centred, so the slack is a margin on both sides rather than a
            void on one. */}
        <div className={`${TRACKS} pb-24 pt-12`}>
          {/* min-w-0, because a grid item is min-width:auto by default and
              a table or a chart wider than the phone would otherwise push
              the track — and with it the whole page — sideways. The blocks
              that are wider than the measure scroll inside their own
              frames; this is what keeps that promise. */}
          <article className="min-w-0 max-w-read font-reading xl:col-start-2 xl:row-start-1">
            {/* The chapter list, for every width the rail does not reach. */}
            <ArticleContents
              headings={headings}
              className="mb-10 rounded-panel border border-rule bg-card px-6 py-5 lg:hidden"
            />

            {children}

            <div className="mt-16 border-t border-rule pt-8">
              {refs.length > 0 && (
                <div className="mb-10">
                  <ScriptureList scriptures={refs} />
                </div>
              )}
              {colophon}
              <div className="ornament mx-auto mt-8 max-w-xs">
                <span aria-hidden className="text-base leading-none">✦</span>
              </div>
              <ShareRow title={title} className="mt-8" />
              <p className="mt-10 text-center">
                <Link
                  href="/"
                  className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:text-gold"
                >
                  ← ALL ARTICLES
                </Link>
              </p>
            </div>

            <ContinueReading rows={related} category={category} />
          </article>

          {/* The one-rail width. Both halves, stacked, on the right. */}
          {/* No explicit row here: a grid item with a definite row is
              placed before the auto-placed ones, which would hand the rail
              the reading track and squeeze the teaching into the rail. */}
          <div className="hidden lg:block xl:hidden">
            <ArticleRail headings={headings}>
              <FulfilledNow />
            </ArticleRail>
          </div>

          {/* The three-column width, where they part company. */}
          {headings.length > 1 && (
            <aside className="hidden self-start xl:sticky xl:top-stick xl:col-start-1 xl:row-start-1 xl:block">
              <ChapterNav headings={headings} />
            </aside>
          )}
          {/* The right-hand rail used to list the Scriptures the teaching
              cites, which is apparatus: a reader consults it after the
              reading, not during it. What belongs beside a teaching about
              repentance is the ministry's own record of what it said would
              happen — so the scriptures moved to the close, where they are
              consulted, and the archive took the rail. */}
          <aside className="hidden self-start xl:sticky xl:top-stick xl:col-start-3 xl:row-start-1 xl:block">
            <FulfilledNow />
          </aside>
        </div>
      </main>
    </>
  )
}
