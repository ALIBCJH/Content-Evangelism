import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Posted } from '@/components/posted'
import { ArrowLeft, BadgeCheck, CircleDashed } from 'lucide-react'
import { siteUrl, topicHref, type Category } from '@/lib/content'
import type { RealRow } from '@/lib/rows'
import type { Verse } from '@/lib/scripture-index'
import { scriptureRefs } from '@/lib/scripture'
import type { Heading } from '@/lib/toc'
import { ArticleContents } from '@/components/article-contents'
import { AskQuestion } from '@/components/ask-question'
import { ArticleRail, ChapterNav, ScriptureList } from '@/components/article-rail'
import { JsonLd } from '@/components/json-ld'
import { ContinueReading } from '@/components/continue-reading'
import { FollowChannel } from '@/components/follow-channel'
import { MoreArticles } from '@/components/more-articles'
import { PieceActions } from '@/components/piece-actions'
import { ReadingProgress } from '@/components/progress-bar'
import { SectionTimer } from '@/lib/section-time'
import { ShareRow } from '@/components/share-row'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  /** The piece's own identifier, and the last part of its URL. */
  slug: string
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
  hero?: { src: string; alt: string; caption?: string; width?: number; height?: number }
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
  /**
   * The passage behind each reference, where the archive has set one out.
   * Built on the server from the teachings themselves — see
   * scripture-index.ts.
   */
  verses?: Record<string, Verse>
  /** Set at the close, above the ornament: a scripture list, a note. */
  colophon?: React.ReactNode
  /**
   * What the rail beside the teaching offers. Deliberately not the pieces
   * at the foot of it: the same rows twice is one recommendation wearing
   * two hats.
   */
  more: RealRow[]
  /** The body of the teaching. */
  children: React.ReactNode
}

/**
 * The way back, and whether the desk has been through the teaching.
 *
 * The way back is gold and larger than a plain pill: it is the one
 * control on the page and has to be findable from the end of a long read.
 *
 * Green is the site's fulfilled colour and carries the same meaning here:
 * this was looked at and it holds. The unchecked state is grey and
 * deliberately quiet — it reports that nobody has been through the piece
 * yet, which is not an accusation against it.
 */
function Controls({ verified, className = '' }: { verified?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'gap-2 border-gold bg-gold/10 px-7 text-gold-ink hover:border-gold hover:bg-gold/20 hover:text-gold-ink [&_svg]:size-[1.125rem]'
        )}
      >
        <ArrowLeft aria-hidden />
        All articles
      </Link>
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
    </div>
  )
}

/**
 * The tracks, shared by the band and the reading area.
 *
 * The headline used to sit at the shell's edge while the teaching below it
 * began 300px further in — two left margins on one page, with no relation
 * between them. Both hang off the same grid now, so the headline starts
 * where the chapters start and ends where the teaching ends.
 */
/** The element the reading bar measures, named so a server page can point at it. */
const READING_TARGET = 'the-teaching'

const TRACKS =
  'shell grid gap-12 lg:grid-cols-[minmax(0,var(--read))_280px] lg:justify-center lg:gap-x-[72px] xl:grid-cols-[240px_minmax(0,var(--read))_260px] xl:gap-x-14'

/** Taller than it is wide, and measured rather than assumed. */
function isPortrait(hero: { width?: number; height?: number }): boolean {
  return Boolean(hero.width && hero.height && hero.height > hero.width)
}

export function ArticleLayout({
  slug,
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
  more,
  body,
  scriptures,
  verses,
  colophon,
  children,
}: ArticleLayoutProps) {
  const refs = scriptures ?? scriptureRefs(body, 12)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Articles', item: siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: category,
              item: `${siteUrl}${topicHref(category)}`,
            },
            { '@type': 'ListItem', position: 3, name: title },
          ],
        }}
      />
      {/* The teaching is what is measured, not the page it sits on —
          see the note on `targetId`. */}
      <ReadingProgress
        piece={{ slug, title, href: `/articles/${slug}`, readMinutes }}
        targetId={READING_TARGET}
      />
      {/* Which chapter of this teaching holds a reader, and for how long.
          The page tracker already counts the visit; this counts where the
          time inside it went. */}
      <SectionTimer path={`/articles/${slug}`} ids={headings.map((heading) => heading.id)} />

      <main>
        {/* ── The band ───────────────────────────────────────────── */}
        <section className="border-b border-rule bg-raised">
          {/* One block across the whole grid. A teaching with no photograph
              had been laying its headline into a 1fr track beside an empty
              0.85fr one — half the band blank, and the headline broken over
              three lines to fit a column that was only narrow because of a
              picture that was never there. */}
          <div className={`${TRACKS} pb-5 pt-4`}>
            <div className="col-span-full">
              {/* With a photograph beside the headline the right of the
                  band is spoken for, so the controls stay above it. With
                  no photograph — which is every teaching so far — they
                  move into that space instead; see below. */}
              {hero && <Controls verified={verified} className="mb-4" />}

              {/* The photograph is what asks for two columns. Without one
                  there is nothing to sit beside, and the headline takes
                  the width. */}
              <div
                className={
                  hero
                    ? 'grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-14'
                    : 'flex flex-col gap-y-5 sm:flex-row sm:items-start sm:justify-between sm:gap-x-12'
                }
              >
                <div className="min-w-0">
                  {/* The headline used to be the reading serif at 300 —
                      unhurried, and easy to read past. A teaching has to
                      earn a reader who is deciding in a second whether to
                      stay, so it is set the way a headline is set when that
                      is its job: the sans at 700, tight, with the tracking
                      pulled in. The teaching itself is still the serif —
                      this changes what announces the piece, not what is
                      read for ten minutes. */}
                  <h1 className="mb-3 text-balance font-apparatus text-[1.625rem] font-bold leading-[1.1] tracking-[-0.022em] text-navy sm:text-[2rem] lg:text-[2.375rem]">
                    {title}
                  </h1>
                  {/* The standfirst keeps a measure of its own — a headline
                      can run the width of the page, two sentences cannot —
                      and it follows the headline out of the italic serif.
                      Set upright in the same face, it reads as the second
                      line of the announcement rather than as a caption
                      apologising under it. */}
                  <p className="mb-3.5 max-w-[44rem] text-pretty font-apparatus text-[0.9375rem] leading-[1.55] text-ink-700 sm:text-[1rem]">
                    {dek}
                  </p>

                  {/* Read it to me, or keep it for when the line drops.
                      Both were reachable only from the archive's cards,
                      which is not the page most readers arrive on. */}
                  <PieceActions slug={slug} title={title} className="mt-4" />
                </div>

                {/* The way back and the desk's verdict, in the width a
                    headline does not use. They were stacked above the
                    teaching, which cost two rows before the first word;
                    on the right of the same rows they cost none.

                    The byline that sat under the standfirst is gone with
                    them. Author, date and reading time are still in the
                    page's structured data and in the feed, where a search
                    result and a reader's app take them from. */}
                {!hero && <Controls verified={verified} className="order-first shrink-0 sm:order-none sm:items-end" />}

                {hero && (
                  <figure className="m-0">
                    {/* A photograph is cropped to a consistent 3:2, which
                        is what gives every teaching's head the same
                        rhythm. A portrait picture is not: the ministry's
                        artwork is a poster with the headline set into it,
                        and forcing that into a landscape band cuts the
                        words out of the middle of the picture. The page
                        already knows which it is — it measures the file
                        for the structured data — so it can simply not do
                        that. */}
                    {isPortrait(hero) ? (
                      <Image
                        src={hero.src}
                        alt={hero.alt}
                        width={hero.width!}
                        height={hero.height!}
                        priority
                        sizes="(min-width: 1024px) 42vw, 100vw"
                        /* Held to a height rather than run to the full
                           width of the column. A two-by-three poster at
                           390px is five hundred and twenty-five pixels
                           tall — most of the first screen, before a word
                           of the teaching — and a picture that fills the
                           window a reader opened to read is not
                           welcoming, it is a wall. Capped it is an
                           illustration beside the standfirst, which is
                           what it should have been. */
                        className="mx-auto h-auto max-h-[17rem] w-auto rounded-panel bg-navy-deep sm:max-h-[22rem]"
                      />
                    ) : (
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
                    )}
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

            {/* What the reading bar measures: the teaching itself, from
                its first line to its last. Everything below this — the
                Scriptures cited, the byline, the share row, Read Next —
                is apparatus, and a reader who has reached the end of the
                writing has finished the teaching whether or not they go
                on to scroll through it. */}
            <div id={READING_TARGET}>{children}</div>

            <div className="mt-16 border-t border-rule pt-8">
              {refs.length > 0 && (
                <div className="mb-10">
                  <ScriptureList scriptures={refs} verses={verses} />
                </div>
              )}
              {/* Who wrote it and when, at the foot rather than the head.
                  It was under the standfirst, in front of a reader who had
                  not yet decided to read; here it is in front of one who
                  has finished, which is when a person checks how old a
                  thing is and who stands behind it. The same three facts
                  are in the page's Article data for a search result. */}
              <p className="mt-10 border-t border-rule-soft pt-5 font-apparatus text-[0.75rem] tracking-[0.06em] text-ink-subtle">
                {author.href ? (
                  <Link href={author.href} rel="author" className="transition-colors hover:text-gold">
                    {author.name}
                  </Link>
                ) : (
                  <span>{author.name}</span>
                )}
                <span aria-hidden className="mx-2">·</span>
                <Posted iso={publishedAt} />
                <span aria-hidden className="mx-2">·</span>
                <span className="tabular">{readMinutes} MIN READ</span>
              </p>

              {colophon}
              <div className="ornament mx-auto mt-8 max-w-xs">
                <span aria-hidden className="text-base leading-none">✦</span>
              </div>
              <ShareRow title={title} className="mt-8" />
              {/* Asked at the end of a teaching, which is the moment
                  somebody is most likely to want the next one. */}
              <p className="mt-6 text-center">
                <FollowChannel />
              </p>
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
              <MoreArticles rows={more} />
            </ArticleRail>
          </div>

          {/* The three-column width, where they part company. */}
          {headings.length > 1 && (
            <aside className="hidden self-start xl:sticky xl:top-stick xl:col-start-1 xl:row-start-1 xl:block">
              <ChapterNav headings={headings} />
            </aside>
          )}
          {/* This rail has carried two things that were not it. First the
              Scriptures the teaching cites, which is apparatus — consulted
              after a reading rather than during one, and now at the close.
              Then the prophetic record, which is a different archive
              making a different claim, and reads beside a teaching as a
              change of subject. What a reader halfway through a teaching
              wants in their eyeline is the next teaching. */}
          <aside className="hidden self-start xl:sticky xl:top-stick xl:col-start-3 xl:row-start-1 xl:block">
            <MoreArticles rows={more} />
          </aside>
        </div>

        <AskQuestion title={title} subject="this teaching" />
      </main>
    </>
  )
}
