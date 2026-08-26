import * as React from 'react'
import Link from 'next/link'
import { BadgeCheck, CircleDashed } from 'lucide-react'
import { topicHref, type Category } from '@/lib/content'
import { Posted } from '@/components/posted'
import { PieceActions } from '@/components/piece-actions'

/**
 * The head of a teaching.
 *
 * It was a cream band with the headline set in the chrome's sans, the way
 * to the archive and the desk's verdict stacked against the right edge,
 * and no byline at all — the author and the date were at the foot, on the
 * grounds that a reader checks who wrote a thing after reading it. That
 * is true of some readers and false of the ones who have never heard of
 * this ministry, which on a page arriving from a search result is most of
 * them. Trust is decided before the first paragraph, not after the last,
 * and every publication that lives by being believed puts the name and
 * the date at the top. So they are at the top.
 *
 * The band is the ministry's own navy panel now, running the full width.
 * Two things follow. A teaching is unmistakably this publication's from
 * the first screen, which a pale band with words on it is not; and the
 * head of a piece with no photograph has something to *be* rather than
 * being the absence of one. The archive earns its artwork in a listing,
 * where the picture is what makes somebody choose a teaching; here they
 * have already chosen, and what they need is the thing itself.
 *
 * The headline moves back into the reading serif. Set in the sans it
 * announced a screen; set in Newsreader it announces a piece of writing,
 * and it is the same face the teaching underneath is set in, so the page
 * reads as one document rather than as an interface with an article
 * inside it.
 *
 * What is not here: the way back to the archive. It was a gold button in
 * the top right of every teaching, competing with the headline for the
 * one thing the eye should land on first, and offering a reader who has
 * just arrived a way to leave. The site's own masthead is directly above
 * it, and the foot of the teaching carries the link where it belongs —
 * in front of somebody who has finished.
 */
export function ArticleMasthead({
  category,
  title,
  dek,
  author,
  publishedAt,
  readMinutes,
  verified,
  slug,
}: {
  category: Category
  title: string
  dek: string
  author: { name: string; href?: string }
  publishedAt: string
  readMinutes: number
  verified?: boolean
  slug: string
}) {
  return (
    <header className="article-plate">
      {/* Hung off the reading area's own measure, so the headline starts
          where the first sentence starts — see `.article-measure`. */}
      <div className="shell">
        <div className="article-measure pb-9 pt-7 sm:pb-11 sm:pt-9">
          {/* Where this sits in the archive, and whether the desk has been
              through it. The verdict was a chip on the right of the band,
              level with the headline; it is a fact about the teaching and
              belongs on the line that carries the other facts about it. */}
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href={topicHref(category)}
              className="focus-ring kicker rounded-chip text-gold transition-colors hover:text-gold-light"
            >
              {category}
            </Link>
            <span aria-hidden className="h-3 w-px bg-plate-rule" />
            <Verdict verified={verified} />
          </div>

          <h1 className="text-balance font-article text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.014em] text-plate-head sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h1>

          {/* A headline may run the width of the band; two sentences may
              not. The standfirst keeps a measure of its own. */}
          <p className="mt-4 max-w-[46rem] text-pretty font-article text-[1.0625rem] font-normal leading-[1.5] text-plate-pale sm:text-[1.1875rem]">
            {dek}
          </p>

          {/* The one gold rule on the page, and it is doing a job: it
              separates what the teaching is from who stands behind it. */}
          <span aria-hidden className="mt-7 block h-px w-16 bg-gold" />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <p className="font-apparatus text-[0.8125rem] leading-[1.5] text-plate-soft">
              <span className="text-plate-pale">
                {author.href ? (
                  <Link
                    href={author.href}
                    rel="author"
                    className="focus-ring rounded-sm transition-colors hover:text-gold"
                  >
                    {author.name}
                  </Link>
                ) : (
                  author.name
                )}
              </span>
              <span aria-hidden className="mx-2 text-plate-rule">
                ·
              </span>
              <Posted iso={publishedAt} />
              <span aria-hidden className="mx-2 text-plate-rule">
                ·
              </span>
              <span className="tabular">{readMinutes} min read</span>
            </p>

            {/* Read it to me, and keep it for when the line drops. On the
                plate rather than under the standfirst: they are things done
                *to* a teaching, and they read as a row of controls beside
                the byline where under the writing they read as part of it. */}
            <PieceActions slug={slug} title={title} onPlate />
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Whether the desk has read this against the ministry's own teaching.
 *
 * It states either answer. A page that marks only what it has checked
 * leaves a reader to work out for themselves what the silence on every
 * other page means, and the honest answer — nobody has been through this
 * one yet — is not an accusation against the writing.
 */
function Verdict({ verified }: { verified?: boolean }) {
  return (
    <span
      title={
        verified
          ? "Checked by the editorial desk against the ministry's published teaching."
          : 'Not yet checked by the editorial desk.'
      }
      className={`inline-flex items-center gap-1.5 font-apparatus text-[0.6875rem] font-medium uppercase tracking-[0.08em] ${
        verified ? 'text-fulfilled' : 'text-plate-soft'
      }`}
    >
      {verified ? (
        <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <CircleDashed aria-hidden className="h-3.5 w-3.5" />
      )}
      {verified ? 'Verified' : 'Not verified'}
    </span>
  )
}
