import * as React from 'react'
import Link from 'next/link'

export interface OpenerProps {
  href: string
  /** "Friday 7 August" */
  dateLabel: string
  publishedAt: string
  title: string
  /** Full text of the piece; only the head of it is visible. */
  body: string
  /** Scripture reference, or the section it belongs to. */
  scriptureRef: string
  readMinutes: number
}

/**
 * The newest piece, opened in place. The reader starts reading immediately
 * and the text fades out under them into a single Read button — the archive
 * below is for choosing, this is for beginning.
 *
 * The whole body is rendered; `.excerpt` clips it visually (see globals.css),
 * so crawlers and AI engines still receive the complete text.
 */
export function Opener({
  href,
  dateLabel,
  publishedAt,
  title,
  body,
  scriptureRef,
  readMinutes,
}: OpenerProps) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <article className="cloth mb-4 px-6 pt-9 sm:px-9">
      {/* The same meta line the rows below carry, so the opened piece
          reads as the first row of the archive rather than as a banner. */}
      <p className="kicker mb-2.5 block tracking-[0.13em] text-ink-subtle">
        <time dateTime={publishedAt}>{dateLabel}</time>
        <span aria-hidden className="mx-2 text-thread">·</span>
        <span className="tabular normal-case tracking-[0.09em]">{readMinutes} min read</span>
      </p>
      {/* h3, not h2: the month above is the section heading, and this is
          one piece inside it — the same level the rows below sit at. */}
      <h3 className="mb-6 text-balance font-display text-[1.9rem] font-light leading-[1.08] tracking-[-0.018em] text-ink-strong sm:text-[2.2rem] md:text-[2.5rem]">
        {title}
      </h3>

      <div className="excerpt">
        {blocks.map((block, index) => {
          // "## " is a subheading; "> " is pulled scripture.
          if (block.startsWith('## ')) {
            return (
              <h4
                key={index}
                className="font-display text-xl font-normal leading-snug text-ink-strong"
              >
                {block.slice(3).trim()}
              </h4>
            )
          }
          if (block.startsWith('> ')) {
            return (
              <p key={index} className="verse">
                {block.slice(2).trim()}
              </p>
            )
          }
          return <p key={index}>{block}</p>
        })}
      </div>

      <div className="relative z-[2] pb-9 pt-6 text-center">
        <Link
          href={href}
          className="focus-ring inline-block rounded-full bg-navy px-8 py-3 font-sans text-[0.8125rem] font-medium tracking-[0.04em] text-linen transition-colors hover:bg-navy-900"
        >
          Read the whole article
        </Link>
        <span className="mt-4 block font-sans text-[0.6875rem] uppercase tracking-[0.11em] text-gold">
          {scriptureRef}
        </span>
      </div>
    </article>
  )
}
