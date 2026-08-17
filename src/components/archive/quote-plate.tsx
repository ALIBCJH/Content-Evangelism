import * as React from 'react'
import Image from 'next/image'
import type { ArchiveItem } from '@/lib/archive-items'

/**
 * The navy plate beside a piece in the archive.
 *
 * Every listing card used to open with a photograph, and most teachings
 * do not have one — which left a column of house colour saying only what
 * section the piece was filed under. A teaching does have something to
 * show, though: the passage it is built on. So the plate carries the
 * Scripture the piece leads with, pulled from its own text, and the
 * listing tells a reader what ground each piece stands on before they
 * open any of them.
 *
 * It stays navy in both themes — the plate is the ministry's colour, and
 * on a dark page it lifts rather than inverts.
 */
export function QuotePlate({
  item,
  label = 'Key text',
  mark = false,
  className = '',
}: {
  item: ArchiveItem
  /** The kicker at the top: "Key text" on the lead, the reference on a row. */
  label?: string
  /** The ministry's mark, which only the lead plate is large enough for. */
  mark?: boolean
  className?: string
}) {
  const cited = Boolean(item.quote?.cite && item.quote.cite !== label)

  return (
    <div
      className={`relative isolate flex flex-col justify-between overflow-hidden bg-plate p-6 sm:p-7 ${className}`}
    >
      {/* A single soft light in the upper corner, so the plate reads as a
          surface under a lamp rather than as flat fill. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-gold/[0.14] blur-3xl"
      />

      <span className="mb-8 flex items-center gap-2.5">
        {mark && (
          <Image
            src="/logo.png"
            alt=""
            width={26}
            height={26}
            className="rounded-[6px] border border-gold/25"
          />
        )}
        <span className="kicker text-gold-pale">{label}</span>
      </span>

      {item.quote ? (
        <span className="block">
          <span
            aria-hidden
            className="mb-1 block font-display text-[2.5rem] leading-[0.5] text-gold/40"
          >
            &ldquo;
          </span>
          <q className="block font-display text-[1.0625rem] italic leading-[1.5] text-plate-pale [quotes:none] sm:text-[1.1875rem]">
            {item.quote.text}
          </q>
          {(cited || item.moreRefs > 0) && (
            <span className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-gold/25 pt-3.5">
              {/* The reference, unless the kicker above is already it. */}
              {cited && <span className="kicker text-gold-sand">{item.quote.cite}</span>}
              {item.moreRefs > 0 && (
                <span className="kicker text-plate-soft">
                  +{item.moreRefs} reference{item.moreRefs === 1 ? '' : 's'}
                </span>
              )}
            </span>
          )}
        </span>
      ) : (
        /* A piece that quotes nothing as a figure still has a section,
           which is what the plate said before it could say more. */
        <span className="block font-display text-[1.375rem] leading-tight text-gold-sand">
          {item.category}
        </span>
      )}
    </div>
  )
}
