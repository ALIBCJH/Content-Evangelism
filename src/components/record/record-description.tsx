'use client'

import * as React from 'react'

/**
 * The description panel under a record's video.
 *
 * It behaves the way a video description behaves everywhere else on the
 * web, because that is where a reader has learnt to look for it: a shaded
 * box under the player, opening with the dateline, then the first lines of
 * the summary and a "…more". Press anywhere on it and the rest unfolds —
 * the whole summary, the published details, and whatever else the page
 * puts inside it — with a "Show less" to put it away again.
 *
 * Both kinds of record use it. A prophecy unfolds into its timeline and a
 * teaching into its transcript, which is the same panel holding a
 * different second half, so the two are read the same way.
 *
 * Everything is in the markup at all times and the closed state only hides
 * it, so a crawler, a reader without JavaScript, and Cmd-F all see the
 * whole record whether or not the panel has been opened.
 */

export interface DescriptionMeta {
  k: string
  v: string
}

export function RecordDescription({
  dateline,
  summary,
  meta,
  children,
}: {
  /** "JULY 16, 2026 · COLOMBIA · EARTHQUAKE" — the line above the summary. */
  dateline: string
  summary: string
  meta: DescriptionMeta[]
  /** Whatever else the unfolded panel holds: a timeline, a transcript. */
  children?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <section
      id="record-details"
      aria-label="Record details"
      onClick={open ? undefined : () => setOpen(true)}
      className={`mt-5 scroll-mt-stick rounded-panel border border-rule bg-raised px-5 py-5 transition-colors sm:px-7 sm:py-6 ${
        open ? '' : 'cursor-pointer hover:border-rule-strong hover:bg-card'
      }`}
    >
      <p className="mb-3 font-mono text-[0.6875rem] font-medium tracking-[0.06em] text-navy">
        {dateline}
      </p>

      <p
        className={`max-w-measure text-[1.0625rem] leading-[1.75] text-ink-900 ${
          open ? '' : 'line-clamp-2'
        }`}
      >
        {summary}
      </p>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-controls="record-details-body"
          className="mt-1.5 font-mono text-[0.75rem] tracking-[0.06em] text-navy transition-colors hover:text-gold"
        >
          …MORE
        </button>
      )}

      <div id="record-details-body" className={open ? 'block' : 'hidden'}>
        <dl className="mt-6 border-t border-rule">
          {meta.map((row) => (
            <div
              key={row.k}
              className="flex justify-between gap-5 border-b border-rule-soft py-3 text-[0.9375rem] last:border-b-0"
            >
              <dt className="text-ink-muted">{row.k}</dt>
              <dd className="text-right font-mono text-[0.8125rem] text-navy">{row.v}</dd>
            </div>
          ))}
        </dl>

        {children}

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded
          aria-controls="record-details-body"
          className="mt-6 font-mono text-[0.75rem] tracking-[0.06em] text-navy transition-colors hover:text-gold"
        >
          SHOW LESS
        </button>
      </div>
    </section>
  )
}
