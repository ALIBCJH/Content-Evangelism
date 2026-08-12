import * as React from 'react'
import Link from 'next/link'
import { parseBody, type Inline } from '@/lib/article-body'

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
const RUNNING_TEXT = 'font-serif text-[1.1875rem] leading-[1.78] text-ink text-pretty'

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
              'border-b border-gold-ink/45 pb-px text-ink transition-colors hover:border-gold-ink hover:text-gold-ink'
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
                className="mt-14 scroll-mt-28 text-balance font-display text-[1.6rem] font-semibold leading-snug text-ink-strong md:text-[1.85rem]"
              >
                {block.text}
              </h2>
            )

          case 'quote':
            return (
              <blockquote
                key={index}
                className="my-10 border-l-2 border-gold-ink/60 pl-6 font-display text-[1.3rem] font-light italic leading-[1.55] text-ink-strong md:pl-7"
              >
                <p>
                  <Inlines inlines={block.inlines} />
                </p>
                {block.cite && (
                  <cite className="mt-3 block font-sans text-[0.6875rem] uppercase not-italic tracking-kicker text-ink-subtle">
                    {block.cite}
                  </cite>
                )}
              </blockquote>
            )

          case 'list': {
            /* marker:text-gold would paint the bright chrome gold on
               white; on paper the marker takes the darkened ink value. */
            const className = `mt-7 space-y-3 pl-6 ${RUNNING_TEXT} marker:text-gold-ink`
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
                className={`mt-7 ${RUNNING_TEXT} ${isFirst ? 'dropcap mt-0' : ''}`}
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
