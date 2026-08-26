import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticleDiagram } from '@/components/article-diagram'
import { SharePassage } from '@/components/share-passage'
import { platedQuotes } from '@/lib/scripture-rhythm'
import { RecommendedStories } from '@/components/recommended-stories'
import type { RealRow } from '@/lib/rows'
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
 *
 * The body is Gentium Book Plus at 19px on a 1.74 line — larger and
 * looser than the chrome, because devotional writing wants the space, and
 * because Gentium's tall x-height is what keeps a long passage legible on
 * a phone. Chapter headings are Newsreader; every citation, label and
 * caption is IBM Plex. Serif for what you read, sans for what you scan.
 */

/* One class, used by the paragraph and by every list item, so a bullet
   and the sentence above it are set in the same type. */
const RUNNING_TEXT =
  'font-reading text-[1.0625rem] leading-[1.74] text-ink-700 text-pretty sm:text-[1.1875rem]'

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
    panel: 'rounded-panel border border-statement-rule bg-statement-bg px-6 py-7 sm:px-8',
    label: 'kicker mb-4 block text-gold-ink',
    body: 'font-reading text-[1.125rem] leading-[1.6] text-navy sm:text-[1.25rem]',
    cite: 'mt-4 block font-apparatus text-[0.75rem] text-ink-subtle',
  },
  source: {
    panel: 'rounded-figure border border-dashed border-source-rule bg-source-bg px-6 py-6 sm:px-7',
    label: 'kicker-lg mb-3 block text-source-label',
    body: 'font-apparatus text-[0.875rem] leading-[1.6] text-source-ink',
    cite: 'mt-3 block font-apparatus text-[0.75rem] text-source-cite',
  },
  note: {
    panel: 'border-l-2 border-rule pl-4',
    label: 'kicker mb-2 block text-ink-subtle',
    body: 'font-reading text-[1.0625rem] leading-[1.7] text-ink-subtle',
    cite: 'mt-2 block font-apparatus text-[0.75rem] text-ink-subtle',
  },
}

/** What a `@related` slug resolves to: the row for that teaching. */
export type ProseLink = { href: string; title: string; dek: string }

/**
 * Where "what to read next" is dropped into a teaching.
 *
 * At a heading, never mid-thought: an aside between two paragraphs of an
 * argument interrupts it, and between two sections it is a pause the
 * reader was taking anyway. The one nearest the middle, so it is not the
 * first thing a reader meets and not so late that the people who leave
 * early never see it — which is the whole reason it is not simply at the
 * foot, where `ContinueReading` already sits.
 *
 * Nothing is inserted into a teaching with fewer than four headings.
 * There is no middle to speak of, and the foot is close enough.
 */
export function recommendAfter(blocks: ReturnType<typeof parseBody>): number | null {
  const headings = blocks.flatMap((block, index) => (block.kind === 'heading' ? [index] : []))
  if (headings.length < 4) return null
  return headings[Math.floor(headings.length / 2)]
}

export function ArticleProse({
  body,
  links = {},
  recommended = [],
}: {
  body: string
  links?: Record<string, ProseLink>
  /** Teachings to offer part-way through. Empty on the desk's preview. */
  recommended?: RealRow[]
}) {
  const blocks = parseBody(body)
  /* Computed once for the piece rather than per block: the rule is about
     the distance between passages, so it needs the whole of it in hand. */
  const plated = platedQuotes(blocks)
  const recommendAt = recommended.length > 0 ? recommendAfter(blocks) : null
  let firstParagraphSeen = false

  return (
    /* `chapter-run` is what numbers the chapters. The count is kept by CSS
       rather than passed in, because it is a fact about the rendered
       document: nothing here has to hold a running index in step with
       which blocks turned out to be headings. */
    <div className="chapter-run">
      {blocks.map((block, index) => {
        /* Before the heading, so the aside closes the section that was
           finishing rather than interrupting the one about to start. */
        const recommend =
          index === recommendAt ? <RecommendedStories key="recommended" rows={recommended} /> : null

        switch (block.kind) {
          case 'heading':
            /* scroll-mt clears the masthead and the progress rule when a
               chapter link jumps here.

               A chapter carries its own way of being sent. What a reader
               forwards is rarely a whole teaching — it is the part that
               answered the thing they were asked — and until now the only
               thing they could send was the top of the page. */
            return (
              <React.Fragment key={index}>
                {recommend}
              <h2
                id={block.id}
                className="chapter-head group mb-5 mt-[4.5rem] flex scroll-mt-stick items-baseline gap-2.5 text-balance font-article text-[1.625rem] font-bold leading-[1.22] tracking-[-0.008em] text-gold-ink md:text-[2.0625rem]"
              >
                <span className="min-w-0">{block.text}</span>
                <SharePassage id={block.id} heading={block.text} />
              </h2>
              </React.Fragment>
            )

          case 'quote': {
            /* Scripture is set apart on the page, not merely indented:
               a cream figure ruled in gold, with the citation beneath it
               in the mono face every reference on this site is set in.

               Some passages are set on the plate instead — the navy
               field the front page's lead card opens on. Which ones is
               `platedQuotes`, and the whole of the reasoning is there:
               they are the rest points in a long scroll, spaced far
               enough apart to stay rests. */
            if (plated.has(index)) {
              return (
                <figure key={index} className="scripture-plate plate-bleed my-10">
                  <span aria-hidden className="plate-rule" />
                  <span aria-hidden className="plate-mark">&ldquo;</span>
                  <blockquote className="relative font-reading text-[1.25rem] font-normal italic leading-[1.5] sm:text-[1.4375rem]">
                    <Inlines inlines={block.inlines} />
                  </blockquote>
                  {block.cite && (
                    <figcaption className="plate-cite relative mt-4 font-apparatus text-[0.6875rem] font-medium uppercase tracking-[0.15em]">
                      {block.cite}
                    </figcaption>
                  )}
                </figure>
              )
            }
            return (
              <figure key={index} className="scripture my-9">
                <blockquote className="mb-3.5 font-reading text-[1.1875rem] font-normal leading-[1.6] text-navy sm:text-[1.375rem]">
                  <Inlines inlines={block.inlines} />
                </blockquote>
                {block.cite && (
                  <figcaption className="font-apparatus text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-gold-ink">
                    {block.cite}
                  </figcaption>
                )}
              </figure>
            )
          }

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

          case 'related': {
            /* Where a teaching leaves the page in the middle of itself.
               The reader is mid-thought, so this is a headline and the
               summary under it, ruled like the rest of the publication —
               not a strip of thumbnails with a button on each, which is
               the shape an advertisement takes and which a reader has
               learnt to scroll straight past.

               Slugs the site no longer holds simply fall out; if none of
               them resolve there is no panel at all, rather than an empty
               box announcing that something used to be here. */
            const found = block.slugs.map((slug) => links[slug]).filter(Boolean) as ProseLink[]
            if (found.length === 0) return null
            return (
              <aside
                key={index}
                className="my-10 rounded-panel border border-rule border-t-2 border-t-gold bg-card px-6 py-6 sm:px-7"
              >
                <span className="kicker text-gold">Read alongside</span>
                <ul className="mt-4">
                  {found.map((link) => (
                    <li
                      key={link.href}
                      className="border-b border-rule pb-4 pt-4 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <Link href={link.href} className="focus-ring group block">
                        <span className="flex items-baseline gap-2">
                          <span className="font-article text-[1.0625rem] font-normal leading-[1.3] text-navy transition-colors group-hover:text-gold sm:text-[1.1875rem]">
                            <span className="headline-link">{link.title}</span>
                          </span>
                          <ArrowRight
                            aria-hidden
                            className="h-3.5 w-3.5 shrink-0 translate-y-px text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-gold"
                          />
                        </span>
                        <span className="mt-1.5 block text-[0.9375rem] leading-[1.6] text-ink-muted">
                          {link.dek}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
            /* Two frames, because recordings come in two shapes. A short
               is upright and sits in a narrow column beside its caption;
               a sermon is landscape, and a landscape recording squeezed
               into that column is a postage stamp, so `wide` gives it the
               full measure with the caption underneath. */
            return (
              <figure
                key={index}
                className={`my-9 flex flex-col overflow-hidden rounded-panel border border-navy-rule bg-navy-deep ${
                  block.wide ? '' : 'sm:flex-row sm:items-stretch'
                }`}
              >
                <div
                  className={`relative w-full shrink-0 ${
                    block.wide ? 'aspect-video' : 'aspect-[9/16] sm:w-[clamp(150px,34%,200px)]'
                  }`}
                >
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
                  <span className="mb-2.5 block font-display text-[1.375rem] leading-[1.25] text-plate-pale sm:text-[1.625rem]">
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

          case 'diagram':
            return <ArticleDiagram key={index} name={block.name} caption={block.caption} />

          case 'figure':
            /* A photograph in the running text, framed like the table and
               the diagram so a teaching's figures are recognisably one
               family. It is never given a fixed height: the frame takes
               the shape the photograph is, which is what stops a portrait
               and a group shot being cropped to the same letterbox — and
               the body's own WxH is what reserves that shape before the
               file lands, so nothing under it moves. */
            return (
              <figure
                key={index}
                className="my-9 overflow-hidden rounded-panel border border-rule bg-card"
              >
                <Image
                  src={block.src}
                  alt={block.alt}
                  width={block.width ?? 1600}
                  height={block.height ?? 1067}
                  sizes="(min-width: 1280px) 34rem, (min-width: 640px) 90vw, 100vw"
                  className="h-auto w-full"
                />
                {block.caption && (
                  <figcaption className="border-t border-rule px-6 py-4 font-apparatus text-[0.8125rem] leading-[1.6] text-ink-subtle">
                    {block.caption}
                  </figcaption>
                )}
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

          case 'faq':
            /* Where the devotional ends and the apparatus begins. The
               reader is told by the type, not by a label: this whole
               section is set in the sans face, so it reads as reference
               rather than as more of the teaching. */
            return (
              <section
                key={index}
                className="mt-20 border-t border-rule pt-12 font-apparatus"
              >
                <h2 className="mb-8 text-[0.6875rem] font-semibold uppercase tracking-[0.19em] text-ink-subtle">
                  Frequently asked questions
                </h2>
                {block.items.map(({ q, a }) => (
                  <div key={q} className="mb-8 last:mb-0">
                    <h3 className="mb-2 text-[0.9375rem] font-semibold leading-[1.45] text-ink-strong">
                      {q}
                    </h3>
                    <p className="text-[0.9375rem] leading-[1.68] text-ink-muted">{a}</p>
                  </div>
                ))}
              </section>
            )

          default: {
            const isFirst = !firstParagraphSeen
            firstParagraphSeen = true
            /* The opening paragraph is set a size larger and takes the
               initial. A teaching opens with no picture — the artwork
               earns its place in a listing, where it is what makes
               somebody choose the piece, and is a thing to scroll past
               once they have — so the page still needs somewhere for the
               eye to start, and the answer a scripture-publishing house
               has used for five hundred years is the illuminated letter.
               See `.dropcap`, which withdraws it on a narrow phone. */
            return (
              <p
                key={index}
                className={
                  isFirst
                    ? 'dropcap font-reading text-pretty text-[1.1875rem] leading-[1.7] text-ink-900 sm:text-[1.25rem]'
                    : `mt-5 ${RUNNING_TEXT}`
                }
              >
                <Inlines inlines={block.inlines} />
              </p>
            )
          }
        }
      })}
    </div>
  )
}
