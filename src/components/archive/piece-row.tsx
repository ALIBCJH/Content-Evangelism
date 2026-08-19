'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import { QuotePlate } from '@/components/archive/quote-plate'
import { SaveButton } from '@/components/archive/save-button'

/**
 * One piece below the lead.
 *
 * Two cards, one component, because a phone and a desk are not reading
 * the same way.
 *
 * From `sm` up it is the design's two-part card: the passage on the navy
 * plate, and what the teaching does with it beside the plate. That
 * composition is the archive's signature and it holds at a width where
 * both halves can be read at once.
 *
 * Below `sm` it is a row. Stacked, the plate put four lines of italic
 * Scripture *above* every headline, which meant each card opened on its
 * quietest part and buried the line that does the work. So the plate
 * comes off, the headline leads, the references collapse to one line, and
 * the piece's own picture — or the passage it stands on, set as a small
 * tile — holds the right edge to keep the column in rhythm.
 *
 * On a phone it is also what the newest piece looks like. The lead card
 * — the plate at full height, the standfirst, two buttons — ran to a
 * whole screen there, so the archive opened on one piece and a reader had
 * to scroll before learning there were others. Below `sm` the newest
 * piece is this row with a Latest chip and a stronger edge, and the wide
 * page keeps its front page.
 *
 * The whole card is one link and always has been: the headline's anchor
 * is stretched over the card by a pseudo-element, so a tap lands on the
 * piece wherever it falls. What the card lacked was any sign of that, and
 * a card that is a link without looking like one is a card readers scroll
 * past — so the foot says so, in the corner a thumb already rests over.
 */
export function PieceRow({
  item,
  saved,
  ready,
  onToggle,
  latest = false,
}: {
  item: ArchiveItem
  saved: boolean
  ready: boolean
  onToggle: () => void
  /** The newest piece, standing in for the lead card on a phone. */
  latest?: boolean
}) {
  /* The passage on the tile, unless the piece has a picture for it. */
  const tileRef = item.image ? undefined : plainRef(item.quote?.cite ?? item.refs[0])
  const total = item.refs.length + item.moreRefs
  const references = tileRef
    ? total > 1
      ? `+${total - 1} more references`
      : ''
    : [item.refs[0], total > 1 ? `+${total - 1} more` : ''].filter(Boolean).join(' · ')

  return (
    <article
      className={`card card-glow card-interactive group relative h-full overflow-hidden sm:grid ${
        latest ? 'card-glow-lead' : ''
      } sm:grid-cols-[minmax(0,34%)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,36%)_minmax(0,1fr)]`}
    >
      <QuotePlate
        item={item}
        label={item.quote?.cite ?? item.category}
        className="hidden min-h-[180px] sm:flex sm:min-h-[240px]"
      />

      <div className="flex min-w-0 flex-col p-4 sm:block sm:p-7">
        {/* On a phone: the words, and the tile at the edge beside them. */}
        <div className="flex min-w-0 gap-4 sm:block">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 sm:mb-3.5">
              {latest && (
                <span className="kicker inline-flex items-center gap-1.5 rounded-chip bg-chip-gold px-2.5 py-1 text-gold-ink">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Latest
                </span>
              )}
              <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
                {item.category}
              </span>
              <time
                dateTime={item.publishedAt}
                className="font-mono text-[0.625rem] tracking-[0.08em] text-ink-subtle sm:text-[0.6875rem]"
              >
                {item.dated} · <span className="tabular">{item.readMinutes}</span> MIN
              </time>
              <span className="ml-auto hidden sm:block">
                <SaveButton
                  saved={saved}
                  ready={ready}
                  onToggle={onToggle}
                  title={item.title}
                  compact
                />
              </span>
            </div>

            <h3 className="mb-2 font-display text-[1.125rem] font-medium leading-[1.2] text-navy sm:mb-3 sm:text-balance sm:text-[1.75rem] sm:leading-[1.15]">
              <Link
                href={item.href}
                className="focus-ring rounded-sm before:absolute before:inset-0 before:z-0"
              >
                <span className="headline-link">{item.title}</span>
              </Link>
            </h3>

            <p className="line-clamp-2 max-w-[62ch] text-[0.875rem] leading-[1.6] text-ink-muted sm:mb-5 sm:text-[0.9375rem] sm:leading-[1.7]">
              {item.excerpt}
            </p>

            {/* The wide card's foot: the references as chips, and the way
                in as a button beside them. */}
            <div className="mt-auto hidden flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4 sm:flex">
              <span className="flex flex-wrap gap-2">
                {item.refs.map((ref) => (
                  <span
                    key={ref}
                    className="rounded-chip bg-chip px-3 py-1.5 font-mono text-xs text-ink-700"
                  >
                    {ref}
                  </span>
                ))}
              </span>
              <Link
                href={item.href}
                data-track="read-article"
                className="focus-ring relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-tile bg-gold px-5 py-2.5 text-[0.875rem] font-semibold text-plate-deep transition-colors hover:bg-gold-light"
              >
                Read article <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* The right edge of the row, on a phone only. */}
          <div className="flex shrink-0 flex-col items-center gap-2.5 sm:hidden">
            <Thumb item={item} reference={tileRef} />
            <SaveButton saved={saved} ready={ready} onToggle={onToggle} title={item.title} compact />
          </div>
        </div>

        {/* The foot of the card, on a phone: what the piece is built on,
            and the way in.

            The way in is a mark, not a button. A filled button in the
            corner of every card turned a column of teachings into a column
            of adverts, all shouting the same word — and it was shouting
            something the card already does, since the whole surface has
            always been the link. So it speaks the site's own idiom
            instead: small gold, an arrow in a disc, the same sentence
            "SOURCE →" and "VIEW RECORD →" say everywhere else. It is
            aria-hidden and out of the tab order on purpose, going exactly
            where the headline above it goes; a screen reader should be
            handed that destination once, not twice. */}
        <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
          <span className="min-w-0 truncate font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
            {references}
          </span>
          <Link
            href={item.href}
            data-track="read-article"
            aria-hidden
            tabIndex={-1}
            className="relative z-10 flex shrink-0 items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-gold-ink"
          >
            Read
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-full border border-gold-pale bg-chip-gold text-[0.8125rem] leading-none text-gold-ink transition-transform group-active:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  )
}

/** "Matthew 6:24, KJV" → "Matthew 6:24". The translation is apparatus. */
function plainRef(reference: string | undefined): string | undefined {
  return reference?.split(',')[0]?.trim() || undefined
}

/**
 * The square at the end of a row: the piece's photograph where it has
 * one, and where it has not, the passage it stands on set as a plate.
 *
 * A row with nothing at its edge and a row with a picture read as two
 * different lists, so the fallback is not blank — it is the same navy and
 * the same reference the wide card gives the plate, at the size a thumb
 * needs it.
 */
function Thumb({ item, reference }: { item: ArchiveItem; reference?: string }) {
  if (item.image) {
    return (
      <Image
        src={item.image.src}
        alt={item.image.alt}
        width={80}
        height={80}
        sizes="80px"
        className="h-20 w-20 rounded-tile border border-rule object-cover"
      />
    )
  }

  return (
    <span
      aria-hidden
      className="grid h-20 w-20 place-items-center rounded-tile border border-navy-rule bg-plate px-2 text-center"
    >
      {reference ? (
        <span className="font-mono text-[0.5625rem] uppercase leading-[1.4] tracking-[0.06em] text-gold-pale">
          {reference}
        </span>
      ) : (
        <span className="font-display text-[1.5rem] leading-none text-gold/60">&ldquo;</span>
      )}
    </span>
  )
}
