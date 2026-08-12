import * as React from 'react'
import Link from 'next/link'
import { parseBody, type CalloutTone, type Inline } from '@/lib/article-body'
import { embedSrc, watchHref } from '@/lib/youtube'

/**
 * The article body, rendered.
 *
 * Paragraphs and `## ` headings render exactly as they always have, so
 * nothing already published moves. What is new is everything a writer
 * needs to link out of a piece — into another teaching, a topic, or a
 * cited source — plus quoted Scripture and lists, which is the markup a
 * teaching actually wants and which search engines read as structure
 * rather than as an undifferentiated wall of prose.
 *
 * Every value below is set for a ten- to twenty-minute read: running text
 * in --ink rather than the muted grey the deks use, a line height with
 * air in it, and paragraph spacing wide enough that the eye finds the
 * next line without hunting. Muted grey is correct for a caption and
 * wrong for two thousand words.
 */

/* One class, used by the paragraph and by every list item, so a bullet
   and the sentence above it are set in the same type. */
const RUNNING_TEXT = 'text-[1.0625rem] leading-[1.8] text-ink-700 text-pretty sm:text-[1.125rem]'

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((inline, index) => {
        switch (inline.kind) {
          case 'strong':
            return (
              <strong key={index} className="font-semibold text-ink-strong">
                {inline.text}
              </strong>
            )
          case 'em':
            return <em key={index}>{inline.text}</em>
          case 'link': {
            /* A link in running prose is the sentence it sits in, ruled
               underneath in gold. It darkens on hover rather than
               lightening — the earlier treatment moved to bright gold,
               which on white is the lower-contrast direction. */
            const className =
              'border-b border-gold/50 pb-px text-ink-900 transition-colors hover:border-gold hover:text-gold-ink'
            // Internal links go through next/link so the next teaching is
            // already fetched by the time the reader decides to open it.
            return inline.href.startsWith('/') || inline.href.startsWith('#') ? (
              <Link key={index} href={inline.href} className={className}>
                {inline.text}
              </Link>
            ) : (
              <a
                key={index}
                href={inline.href}
                rel="noopener noreferrer"
                target="_blank"
                className={className}
              >
                {inline.text}
              </a>
            )
          }
          default:
            return <React.Fragment key={index}>{inline.text}</React.Fragment>
        }
      })}
    </>
  )
}

/* The three panels the design draws, and the one thing that separates
   them: who is speaking. `statement` is the ministry speaking for itself,
   `source` is the desk blocking its own copy from publishing, and `note`
   is an aside beside the running text. They are deliberately not
   interchangeable — a reader can tell them apart at a glance. */
const CALLOUT: Record<CalloutTone, { panel: string; label: string; body: string; cite: string }> = {
  statement: {
    panel: 'rounded-panel border border-[#E8DEC2] bg-[#FBF7EC] px-6 py-7 sm:px-8',
    label: 'kicker mb-4 block text-gold-ink',
    body: 'font-display text-[1.25rem] leading-[1.5] text-navy sm:text-[1.375rem]',
    cite: 'mt-4 block font-mono text-[0.6875rem] text-ink-subtle',
  },
  source: {
    panel: 'rounded-figure border border-dashed border-[#C9906A] bg-[#FBF0E9] px-6 py-6 sm:px-7',
    label: 'kicker-lg mb-3 block text-[#A85B32]',
    body: 'text-base leading-[1.75] text-[#5C4636]',
    cite: 'mt-3 block font-mono text-[0.6875rem] text-[#8A6A55]',
  },
  note: {
    panel: 'border-l-2 border-rule pl-4',
    label: 'kicker mb-2 block text-ink-subtle',
    body: 'text-base leading-[1.7] text-ink-subtle',
    cite: 'mt-2 block font-mono text-[0.6875rem] text-ink-subtle',
  },
}

export function ArticleProse({ body }: { body: string }) {
  const blocks = parseBody(body)
  let firstParagraphSeen = false

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            /* scroll-mt clears the masthead and the progress rule when a
               chapter link jumps here. */
            return (
              <h2
                key={index}
                id={block.id}
                className="mb-5 mt-14 scroll-mt-stick text-balance font-display text-[1.625rem] font-medium leading-[1.15] text-navy md:text-[2.125rem]"
              >
                {block.text}
              </h2>
            )

          case 'quote':
            /* Scripture is set apart on the page, not merely indented:
               a cream figure ruled in gold, with the citation beneath it
               in the mono face every reference on this site is set in. */
            return (
              <figure key={index} className="scripture my-9">
                <blockquote className="mb-3.5 font-display text-[1.3125rem] font-normal leading-[1.45] text-navy sm:text-[1.5625rem]">
                  <Inlines inlines={block.inlines} />
                </blockquote>
                {block.cite && (
                  <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
                    {block.cite}
                  </figcaption>
                )}
              </figure>
            )

          case 'callout': {
            const tone = CALLOUT[block.tone]
            return (
              <aside key={index} className={`my-9 ${tone.panel}`}>
                {block.label && <span className={tone.label}>{block.label}</span>}
                <p className={tone.body}>
                  <Inlines inlines={block.inlines} />
                </p>
                {block.cite && <span className={tone.cite}>{block.cite}</span>}
              </aside>
            )
          }

          case 'table':
            /* A real table, not a grid of divs: it is a comparison, and a
               screen reader should be able to say which column a cell is
               in. It scrolls inside its own box so the page never does. */
            return (
              <figure
                key={index}
                className="my-9 overflow-hidden rounded-panel border border-rule bg-card"
              >
                {block.caption && (
                  <figcaption className="kicker border-b border-rule px-6 py-4 text-gold">
                    {block.caption}
                  </figcaption>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] border-collapse text-left">
                    <thead>
                      <tr>
                        {block.head.map((cell, i) => (
                          <th
                            key={i}
                            scope="col"
                            className="border-b border-rule bg-raised px-5 py-3.5 font-display text-[1.0625rem] font-normal text-navy"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) =>
                            c === 0 ? (
                              <th
                                key={c}
                                scope="row"
                                className="border-b border-rule-soft px-5 py-4 text-sm font-normal text-ink-subtle"
                              >
                                {cell}
                              </th>
                            ) : (
                              <td
                                key={c}
                                className="border-b border-rule-soft px-5 py-4 text-[0.9375rem] leading-[1.5] text-ink-900"
                              >
                                {cell}
                              </td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )

          case 'video':
            return (
              <figure
                key={index}
                className="my-9 flex flex-col overflow-hidden rounded-panel border border-navy-rule bg-navy-deep sm:flex-row sm:items-stretch"
              >
                <div className="relative aspect-[9/16] w-full shrink-0 sm:w-[clamp(150px,34%,200px)]">
                  <iframe
                    src={embedSrc(block.id)}
                    title={block.title}
                    allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                <figcaption className="flex min-w-0 flex-1 flex-col justify-center px-6 py-7">
                  {block.eyebrow && (
                    <span className="kicker mb-3.5 block text-gold-pale">{block.eyebrow}</span>
                  )}
                  <span className="mb-2.5 block font-display text-[1.375rem] leading-[1.25] text-card sm:text-[1.625rem]">
                    {block.title}
                  </span>
                  <span className="block text-[0.8125rem] leading-[1.6] text-navy-soft">
                    {block.byline}
                    {block.byline ? ' · ' : ''}
                    <a
                      href={watchHref(block.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-pale underline-offset-2 hover:underline"
                    >
                      watch on YouTube
                    </a>
                  </span>
                </figcaption>
              </figure>
            )

          case 'list': {
            /* marker:text-gold would paint the bright chrome gold on
               white; on paper the marker takes the darkened ink value. */
            const className = `mt-7 space-y-3 pl-6 ${RUNNING_TEXT} marker:text-gold`
            const items = block.items.map((item, i) => (
              <li key={i} className="pl-1.5">
                <Inlines inlines={item} />
              </li>
            ))
            return block.ordered ? (
              <ol key={index} className={`${className} list-decimal`}>
                {items}
              </ol>
            ) : (
              <ul key={index} className={`${className} list-disc`}>
                {items}
              </ul>
            )
          }

          default: {
            const isFirst = !firstParagraphSeen
            firstParagraphSeen = true
            return (
              <p
                key={index}
                className={
                  isFirst
                    ? 'text-pretty text-[1.125rem] leading-[1.75] text-ink-900 sm:text-[1.1875rem]'
                    : `mt-5 ${RUNNING_TEXT}`
                }
              >
                <Inlines inlines={block.inlines} />
              </p>
            )
          }
        }
      })}
    </>
  )
}
