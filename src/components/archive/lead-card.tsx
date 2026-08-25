'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bookmark, ChevronDown, Volume2 } from 'lucide-react'
import type { ArchiveItem } from '@/lib/archive-items'
import { Posted } from '@/components/posted'

/**
 * The piece at the head of the archive, given the room to be one.
 *
 * What a reader decides on is here in the order they decide in: what it
 * is filed under, when it was written and how long it takes, the question
 * it answers, the two sentences under that, and the ground it stands on —
 * the passages, as chips, which are the fastest way to know whether a
 * teaching is about the thing you came for.
 *
 * The card opens on the ministry's navy, carrying the verse the teaching
 * itself leads with.
 *
 * The page had no saturated area anywhere: white cards on pale grey,
 * navy set as text, gold spent on chips and hairlines. Nothing caught the
 * eye because nothing was permitted to. A colour field is the one thing
 * that fixes that, and the only field this publication can honestly use
 * is Scripture — it is what the teaching stands on, it is already in the
 * body, and it is the one element on this page no other ministry site
 * has. It is a band across the head of the card rather than a column
 * beside it, which is what it used to be: the layout stays as drawn.
 *
 * A teaching that opens on prose rather than on Scripture has no plate,
 * and the card begins at its kicker as before.
 *
 * There is no "read article" button, because there is nothing to go to:
 * the teaching itself carries on below this card as the reader scrolls.
 * What is left are the two things scrolling does not do — being read to,
 * and putting the piece aside for later.
 */
export function LeadCard({
  item,
  saved,
  ready,
  onToggle,
  onListen,
  listening,
  kicker,
}: {
  item: ArchiveItem
  /** What this piece is doing at the head of the archive, in two words. */
  kicker: string
  saved: boolean
  ready: boolean
  onToggle: () => void
  onListen: () => void
  listening: boolean
}) {
  return (
    <article className="card card-glow card-glow-lead relative overflow-hidden">
      {item.quote && (
        <div className="scripture-plate px-6 py-7 sm:px-8 sm:py-9">
          {/* Ruled on its opening edge, as the scripture figures inside
              the teachings themselves are ruled. */}
          <span aria-hidden className="plate-rule absolute inset-y-6 left-0 w-[3px] rounded-full sm:inset-y-8" />
          <span
            aria-hidden
            className="plate-mark absolute right-6 top-5 font-display text-[2.5rem] leading-none sm:right-8"
          >
            &ldquo;
          </span>
          <blockquote className="relative max-w-[34rem] font-reading text-[1.125rem] font-normal italic leading-[1.5] sm:text-[1.3125rem]">
            {item.quote.text}
          </blockquote>
          {item.quote.cite && (
            <p className="plate-cite relative mt-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
              {item.quote.cite}
            </p>
          )}
        </div>
      )}

      <div className="p-6 sm:p-8">
      {/* Three words saying what this card is. A reader arriving on the
          front page cannot otherwise tell whether the piece at the top is
          the newest, the most read, or the best match for what they just
          typed — and the sort chips are a control, not a label. */}
      <p className="kicker-lg text-gold">{kicker}</p>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span className="kicker text-ink-subtle">{item.category}</span>
        <span aria-hidden className="text-ink-subtle">
          ·
        </span>
        <span className="kicker text-ink-subtle">
          {/* The head of the archive is where a piece posted this morning
              is most likely to be seen, so it is the one place the
              recency is worth most. It was a bare span before, which also
              gave a crawler nothing machine-readable. */}
          <Posted iso={item.publishedAt} dated={item.dated} /> ·{' '}
          <span className="tabular">{item.readMinutes}</span> min
        </span>
      </p>

      {/* The front page has one headline and it is allowed to be a
          headline. Balanced, so a three-line title breaks evenly rather
          than leaving one word alone on the last line. */}
      <h2 className="mt-3.5 text-balance font-article text-[2rem] font-normal leading-[1.08] text-navy sm:text-[2.5rem] xl:text-[2.75rem]">
        <Link href={item.href} data-track="read-article" className="focus-ring">
          <span className="headline-link">{item.title}</span>
        </Link>
      </h2>

      <p className="mt-4 max-w-[38rem] text-pretty text-[1.125rem] leading-[1.6] text-ink-700">
        {item.dek}
      </p>

      {item.refs.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {item.refs.map((ref) => (
            <li key={ref}>
              {/* A passage is a question a reader might follow, so it is a
                  link rather than a label: it searches the archive for
                  everything else standing on the same ground. */}
              <Link
                href={`/search?q=${encodeURIComponent(ref)}`}
                className="focus-ring block rounded-chip bg-chip-gold px-3.5 py-1.5 font-mono text-[0.8125rem] tracking-[0.02em] text-gold-ink transition-colors hover:bg-gold-pale/50"
              >
                {ref}
              </Link>
            </li>
          ))}
          {item.moreRefs > 0 && (
            <li className="self-center font-mono text-[0.8125rem] text-ink-subtle">
              +{item.moreRefs}
            </li>
          )}
        </ul>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <button
          type="button"
          onClick={onListen}
          aria-pressed={listening}
          data-track="listen-article"
          className="focus-ring inline-flex items-center gap-2 rounded-chip bg-cta px-5 py-2.5 text-[0.9375rem] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
        >
          <Volume2 aria-hidden className="h-4 w-4" />
          {listening ? 'Listening' : 'Listen'}
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={ready ? saved : undefined}
          className="focus-ring inline-flex items-center gap-2 rounded-chip border border-rule px-4 py-2.5 text-[0.9375rem] text-ink transition-colors hover:border-gold/60 hover:text-gold-ink"
        >
          <Bookmark
            aria-hidden
            className={`h-4 w-4 ${ready && saved ? 'fill-gold text-gold' : ''}`}
          />
          {ready && saved ? 'Saved' : 'Save'}
        </button>

        {/* The teaching runs on below this card, and nothing said so.
            "Read article" used to stand here and at least implied a way
            in; scrolling is the way in now, and a reader arriving for the
            first time has to be told that once. */}
        <a
          href="#continue"
          className="focus-ring group ml-auto hidden items-center gap-1.5 font-apparatus text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-muted transition-colors hover:text-gold-ink sm:inline-flex"
        >
          Read on
          <ChevronDown
            aria-hidden
            className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5"
          />
        </a>
      </div>
      </div>
    </article>
  )
}
