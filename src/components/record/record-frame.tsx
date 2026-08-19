import * as React from 'react'

/**
 * The frame a recording sits in on a record page.
 *
 * A bare embed in a bordered box says nothing about what is in it, and
 * the label that did say — a pill under the player — sat below the thing
 * it was labelling, where a reader meets it after deciding whether to
 * press play.
 *
 * So the label goes on top, on a bar the width of the player: a play
 * mark, what this recording is, and the one line of provenance that
 * matters. Navy on the left running into gold on the right, which is the
 * ministry's own pair — the device is borrowed from a broadcaster's
 * "video of the day" strip, the colour is not.
 *
 * The bar is not a control. It is a caption that happens to sit above its
 * figure, and pressing it does nothing; the player underneath is the
 * player.
 */
export function RecordFrame({
  kicker,
  note,
  action,
  children,
}: {
  /** "Primary Source", "Recording" — what this is, in three words. */
  kicker: string
  /** The provenance line: who published it, and when. */
  note: string
  /** An optional link at the right of the bar — "Watch on YouTube". */
  action?: React.ReactNode
  /** The embed itself. */
  children: React.ReactNode
}) {
  return (
    <figure className="m-0 overflow-hidden rounded-figure border border-gold/45 bg-plate shadow-[0_10px_30px_-18px_rgb(var(--plate-rgb)/0.9)]">
      <figcaption className="flex flex-wrap items-center gap-x-3.5 gap-y-2 bg-gradient-to-r from-plate via-navy to-gold-ink px-4 py-3 sm:px-5">
        <span
          aria-hidden
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-pale/90 text-plate"
        >
          <svg width="9" height="11" viewBox="0 0 20 24" fill="currentColor">
            <path d="M2 2l16 10L2 22z" />
          </svg>
        </span>

        <span className="min-w-0">
          <span className="block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-gold-sand">
            {kicker}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] font-semibold leading-[1.35] text-plate-pale sm:text-[0.875rem]">
            {note}
          </span>
        </span>

        {action && <span className="ml-auto shrink-0">{action}</span>}
      </figcaption>

      {/* 16:9, held by padding rather than by an aspect utility, so the
          box has its height before the embed has loaded anything. */}
      <div className="relative h-0 bg-navy-deep pb-[56.25%]">{children}</div>
    </figure>
  )
}
