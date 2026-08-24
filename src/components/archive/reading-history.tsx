'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import {
  forget,
  forgetAll,
  isFinished,
  minutesLeft,
  percentRead,
  type ReadingMark,
} from '@/lib/reading-progress'

/**
 * What the reader has read, and how much of it, at the foot of the archive.
 *
 * A teaching here runs ten or twenty minutes, which is more than one
 * sitting for most people, and a reader coming back had nothing to come
 * back to: the archive looked exactly as it had the first time. The rail
 * offers the most recent unfinished piece at the top of a wide screen;
 * this is the whole shelf, at the end of the page, where somebody who has
 * scrolled the archive without finding anything new will meet it.
 *
 * Finished pieces are on it. They were not, and their absence was the
 * whole trouble with this shelf: a reader could see six teachings they
 * had abandoned and no sign of the twelve they had read, which answers
 * the opposite of the question they came with. A finished teaching says
 * so and offers itself to be read again; an unfinished one says how far
 * in it got and how long is left.
 *
 * It is this browser's own memory and nothing else — see
 * reading-progress.ts. Nothing about it reaches the site, which is why a
 * reader can also simply throw it away, one piece or all of it.
 */
export function ReadingHistory({
  marks,
  ready,
  /** For the section of each piece, which the mark does not carry. */
  sections,
}: {
  marks: ReadingMark[]
  ready: boolean
  sections: Map<string, string>
}) {
  if (!ready || marks.length === 0) return null

  const read = marks.filter(isFinished).length

  return (
    <section aria-labelledby="still-reading" className="border-t border-rule bg-raised">
      <div className="shell py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="still-reading" className="font-display text-[1.375rem] font-medium text-navy">
            What you have been reading
          </h2>
          <button
            type="button"
            onClick={forgetAll}
            className="focus-ring kicker text-ink-subtle transition-colors hover:text-gold-ink"
          >
            Clear all
          </button>
        </div>

        <p className="mt-1.5 max-w-prose text-[0.875rem] leading-[1.6] text-ink-muted">
          {read > 0 && (
            <>
              <span className="tabular text-ink-900">{read}</span>{' '}
              {read === 1 ? 'teaching' : 'teachings'} read to the end
              {marks.length > read && (
                <>
                  , <span className="tabular text-ink-900">{marks.length - read}</span> still open
                </>
              )}
              . {' '}
            </>
          )}
          Kept in this browser only. Nothing about what you read leaves this device.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {marks.map((mark) => {
            const percent = percentRead(mark)
            const done = isFinished(mark)
            return (
              <li key={mark.slug} className="card relative p-5">
                <button
                  type="button"
                  onClick={() => forget(mark.slug)}
                  className="focus-ring absolute right-3 top-3 z-10 rounded-full p-1.5 text-ink-subtle transition-colors hover:text-gold-ink"
                >
                  <X aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Forget {mark.title}</span>
                </button>

                <Link href={mark.href} className="focus-ring group block">
                  <span className="absolute inset-0" aria-hidden />
                  {sections.get(mark.slug) && (
                    <span className="kicker text-ink-subtle">{sections.get(mark.slug)}</span>
                  )}
                  <span className="mt-1.5 block max-w-[16rem] text-pretty font-apparatus text-[1rem] font-bold leading-[1.25] text-navy transition-colors group-hover:text-gold-ink">
                    {mark.title}
                  </span>

                  <span
                    aria-hidden
                    className="mt-3.5 block h-[3px] w-full overflow-hidden rounded-full bg-rule"
                  >
                    <span
                      className={`block h-full rounded-full ${done ? 'bg-fulfilled' : 'bg-gold'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </span>

                  <span className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="kicker flex items-center gap-1.5 text-ink-subtle">
                      {done ? (
                        <>
                          <Check aria-hidden className="h-3 w-3 text-fulfilled" />
                          <span className="text-fulfilled">Read</span>
                        </>
                      ) : (
                        <>
                          <span className="tabular">{percent}%</span> ·{' '}
                          <span className="tabular">{minutesLeft(mark)}</span> min left
                        </>
                      )}
                    </span>
                    <span className="kicker inline-flex items-center gap-1 text-navy transition-colors group-hover:text-gold-ink">
                      {done ? 'Read again' : 'Continue'}
                      <ArrowRight
                        aria-hidden
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
