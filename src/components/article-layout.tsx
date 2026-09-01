import * as React from 'react'
import Link from 'next/link'
import { PublishContents } from '@/components/publish-contents'
import { ReadingPrompt } from '@/components/reading-prompt'
import { siteUrl, topicHref, type Category } from '@/lib/content'
import type { RealRow } from '@/lib/rows'
import type { Verse } from '@/lib/scripture-index'
import { scriptureRefs } from '@/lib/scripture'
import type { Heading } from '@/lib/toc'
import { ArticleMasthead } from '@/components/article-masthead'
import { AskQuestion } from '@/components/ask-question'
import { ChapterBar } from '@/components/chapter-bar'
import { ScriptureList } from '@/components/article-rail'
import { JsonLd } from '@/components/json-ld'
import { ContinueReading } from '@/components/continue-reading'
import { FollowChannel } from '@/components/follow-channel'
import { MoreArticles } from '@/components/more-articles'
import { ReadingProgress } from '@/components/progress-bar'
import { SectionTimer } from '@/lib/section-time'
import { ShareRow } from '@/components/share-row'

/**
 * One article page, for every article.
 *
 * Three parts. The masthead — the ministry's navy panel, carrying the
 * section, the headline, the standfirst and the byline; see
 * `ArticleMasthead` for why the byline moved to the top and the way back
 * to the archive left the head entirely. Under it, pinned, the chapter
 * strip: where the reader is, how much is left, and every chapter one tap
 * away. Then the reading column, with what to read next beside it.
 *
 * What used to be here and is not: a folded contents card between the
 * standfirst and the first sentence, a chapter rail in the left margin at
 * widths most of this ministry's readers do not have, and a floating
 * minutes-left pill in the corner. Those were three answers to one
 * question and they are one strip now — `ChapterBar`.
 *
 * From here down the page leaves the chrome's type behind and is set in
 * the reading layer: Newsreader for the headline, the standfirst and
 * every word of the body; Gentium for quoted Scripture and the panels
 * where the ministry speaks for itself; IBM Plex for the byline and the
 * apparatus. Serif for what you read, sans for what you scan. The column
 * is capped at --read rather than --measure, because the reading serif
 * reaches 65 characters sooner than the chrome's text does.
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
  /** Chapters, for the strip under the masthead. */
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
  /** How many readers have said this teaching helped them. */
  likes?: number
  /** The body of the teaching. */
  children: React.ReactNode
}

/** The element the reading bar measures, named so a server page can point at it. */
const READING_TARGET = 'the-teaching'

/**
 * The reading area: the teaching, and what to read next beside it.
 *
 * Two tracks where there were three. The left one carried the chapters,
 * and the chapters travel with the reader now — so what is left is the
 * writing at the measure it should be read at, and one rail. The pair is
 * centred, so the slack on a wide screen is a margin on both sides rather
 * than a void on one.
 */
const TRACKS =
  'shell grid gap-12 lg:grid-cols-[minmax(0,var(--read))_280px] lg:justify-center lg:gap-x-[72px] xl:gap-x-20'

export function ArticleLayout({
  slug,
  category,
  title,
  dek,
  author,
  publishedAt,
  readMinutes,
  verified,
  headings,
  related,
  more,
  body,
  scriptures,
  verses,
  colophon,
  likes = 0,
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
      {/* Hands the chapters to the rail down the left, which belongs to
          the layout and cannot see them from there. Draws nothing. */}
      <PublishContents headings={headings} />

      <main>
        <ArticleMasthead
          slug={slug}
          category={category}
          title={title}
          dek={dek}
          author={author}
          publishedAt={publishedAt}
          readMinutes={readMinutes}
          verified={verified}
        />

        {/* Where the reader is, pinned under the site's own masthead.
            Outside the reading grid because it spans the window, and
            directly after the band because that is the moment it starts
            being an answer rather than a decoration. */}
        {/* Not at `xl`: from there the rail down the left carries the
            same chapters with more room to say them, and two lists of
            one teaching's parts on one screen is one list too many. */}
        <div className="xl:hidden">
          <ChapterBar headings={headings} targetId={READING_TARGET} readMinutes={readMinutes} />
        </div>

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
          <article className="min-w-0 max-w-read font-article">
            {/* What the reading bar measures: the teaching itself, from
                its first line to its last. Everything below this — the
                Scriptures cited, the byline, the share row, Read Next —
                is apparatus, and a reader who has reached the end of the
                writing has finished the teaching whether or not they go
                on to scroll through it. */}
            <div id={READING_TARGET}>{children}</div>

            {/* One question, at the end of the writing and before the
                apparatus — which is where a reader is when they have
                finished, and where an offer to keep it for later is
                still an offer rather than an interruption. Which
                question depends on how the reading went; see
                `ReadingPrompt`. */}
            <ReadingPrompt slug={slug} readMinutes={readMinutes} targetId={READING_TARGET} />

            <div className="mt-16 border-t border-rule pt-8">
              {refs.length > 0 && (
                <div className="mb-10">
                  <ScriptureList scriptures={refs} verses={verses} />
                </div>
              )}
              {/* No byline here any more. It was at the foot on the
                  grounds that a reader checks who wrote a thing after
                  reading it — true of some readers, and false of the ones
                  who have never heard of this ministry, which on a page
                  arriving from a search result is most of them. It is on
                  the masthead, where trust is actually decided. */}
              {colophon}
              <div className="ornament mx-auto mt-8 max-w-xs">
                <span aria-hidden className="text-base leading-none">✦</span>
              </div>
              {/* The whole row a reader can act with: say it helped,
                  keep it, and send it on. It carries the slug, which is
                  what turns the share bar into that — see `ShareRow`. */}
              <ShareRow title={title} slug={slug} likes={likes} className="mt-8" />
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

          {/* The one rail, from `lg`. It has carried three things that
              were not it. The Scriptures the teaching cites, which is
              apparatus — consulted after a reading rather than during
              one, and now at the close. The prophetic record, which is a
              different archive making a different claim and reads beside
              a teaching as a change of subject. And the chapters, which
              travel with the reader now. What is left is what a reader
              halfway through a teaching actually wants in their eyeline:
              the next teaching. */}
          <aside className="hidden self-start lg:sticky lg:top-stick lg:block">
            <MoreArticles rows={more} />
          </aside>
        </div>

        <AskQuestion title={title} subject="this teaching" />
      </main>
    </>
  )
}
