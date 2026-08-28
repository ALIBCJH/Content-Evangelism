'use client'

import * as React from 'react'
import Link from 'next/link'
import type { Category } from '@/lib/content'
import { clock, type SpeechState } from '@/lib/speech'
import { minutesLeft, percentRead, type ReadingMark } from '@/lib/reading-progress'

/**
 * The rail beside the archive: what is in it, what you were reading, and
 * what is being read to you.
 *
 * Each of the three only appears when it has something to say. A reader
 * who has never opened a teaching has no reading to continue, and a rail
 * that says so is a rail asking to be ignored.
 */

function Divider() {
  return <hr className="my-7 border-0 border-t border-rule" />
}

/**
 * The topics, as one scrolling line — below `lg` only.
 *
 * The rail this belongs to is at the foot of the page on a phone, and
 * deliberately so: stacked above the archive it is a screen of furniture
 * standing between a reader and the teaching, which is the whole reason
 * the column order is reversed at that width. That reasoning is right and
 * it is not touched here.
 *
 * What it left behind is a different problem. Filtering was still in the
 * rail, so on a phone the only way to narrow the archive by subject was
 * to scroll past the entire archive to find the control for it — which is
 * to say there was no way, because nobody scrolls to the bottom of a
 * listing looking for the thing that would have shortened it.
 *
 * One line, not a screen: a row of chips the width of the shell that
 * scrolls sideways, at the top where the control belongs, carrying the
 * same counts and driving the same state as the rail's list. The rail
 * keeps every other thing it holds — what you were reading, what is being
 * read to you — and simply stops drawing its topics at this width, so the
 * two are never both on the page.
 */
export function TopicChips({
  counts,
  total,
  active,
  onPick,
}: {
  counts: { category: Category; count: number }[]
  total: number
  active: Category | null
  onPick: (category: Category | null) => void
}) {
  const chip =
    'focus-ring flex min-h-[40px] shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-chip border px-3.5 text-[0.875rem] transition-colors'
  const on = 'border-transparent bg-chip-gold font-semibold text-gold-ink'
  const off = 'border-rule bg-card text-ink-700'

  return (
    /* Bled to the shell's own margin so the line runs off both edges of
       the screen rather than stopping short of them — which is what says
       "there is more of this sideways" before anybody has touched it. The
       scrollbar is hidden because on a touch device it is a smear across
       the chips and on a trackpad it is drawn only while scrolling. */
    <nav
      aria-label="Filter by topic"
      className="-mx-5 mb-6 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={() => onPick(null)}
        aria-current={active === null ? 'true' : undefined}
        className={`${chip} ${active === null ? on : off}`}
      >
        All
        <span className="tabular text-[0.8125rem] opacity-70">{total}</span>
      </button>
      {counts.map(({ category, count }) => (
        <button
          key={category}
          type="button"
          onClick={() => onPick(category === active ? null : category)}
          aria-current={category === active ? 'true' : undefined}
          className={`${chip} ${category === active ? on : off}`}
        >
          {category}
          <span className="tabular text-[0.8125rem] opacity-70">{count}</span>
        </button>
      ))}
    </nav>
  )
}

export function TopicsRail({
  counts,
  total,
  active,
  onPick,
  unfinished,
  speech,
  onPause,
  onResume,
  onStop,
}: {
  counts: { category: Category; count: number }[]
  total: number
  active: Category | null
  onPick: (category: Category | null) => void
  unfinished: ReadingMark[]
  speech: SpeechState
  onPause: () => void
  onResume: () => void
  onStop: () => void
}) {
  const row =
    'focus-ring flex w-full items-baseline justify-between gap-3 rounded-tile px-3.5 py-2.5 text-left text-[0.9375rem] transition-colors'

  return (
    <div className="lg:sticky lg:top-stick">
      {/* The chip row above the lead carries these below `lg` — see
          TopicChips. Drawn in both places they would be one control with
          two appearances and two positions on the same page. */}
      <div className="hidden lg:block">
      <p className="kicker text-ink-subtle">Topics</p>
      <div className="mt-3 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onPick(null)}
          aria-current={active === null ? 'true' : undefined}
          className={`${row} ${
            active === null
              ? 'bg-chip-gold/60 font-semibold text-navy'
              : 'text-ink-700 hover:bg-surface-2 hover:text-navy'
          }`}
        >
          <span>All articles</span>
          <span className="tabular text-[0.8125rem] text-ink-subtle">· {total}</span>
        </button>
        {counts.map(({ category, count }) => (
          <button
            key={category}
            type="button"
            onClick={() => onPick(category === active ? null : category)}
            aria-current={category === active ? 'true' : undefined}
            className={`${row} ${
              category === active
                ? 'bg-chip-gold/60 font-semibold text-navy'
                : 'text-ink-700 hover:bg-surface-2 hover:text-navy'
            }`}
          >
            <span>{category}</span>
            <span className="tabular text-[0.8125rem] text-ink-subtle">· {count}</span>
          </button>
        ))}
      </div>
      </div>

      {unfinished.length > 0 && (
        <>
          {/* The rule separates the topics from what follows, and below
              `lg` the topics are not here — so without this it is a line
              drawn across the top of the rail with nothing above it. */}
          <div className="hidden lg:block">
            <Divider />
          </div>
          {/* Everything begun and not finished, most recent first. A
              reader who put a teaching down halfway through should not
              have to remember which one it was, or hunt the archive for
              it — the shelf they left it on is here. */}
          <p className="kicker text-ink-subtle">
            {unfinished.length === 1 ? 'Continue reading' : 'Still reading'}
          </p>
          <ul className="mt-3 flex flex-col gap-4">
            {unfinished.map((held) => (
              <li key={held.slug}>
                <Link href={held.href} className="focus-ring group block">
                  <span className="block text-[0.9375rem] font-semibold leading-[1.35] text-navy transition-colors group-hover:text-gold-ink">
                    {held.title}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2.5 block h-[3px] w-full overflow-hidden rounded-full bg-rule"
                  >
                    <span
                      className="block h-full rounded-full bg-gold"
                      style={{ width: `${percentRead(held)}%` }}
                    />
                  </span>
                  <span className="kicker mt-2 block text-ink-subtle">
                    <span className="tabular">{percentRead(held)}%</span> ·{' '}
                    <span className="tabular">{minutesLeft(held)}</span> min left
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {speech.piece && (
        /* Below lg this is at the bottom of the page and the fixed bar
           carries it instead — see audio-bar.tsx. */
        <div className="hidden lg:block">
          <Divider />
          <p className="kicker text-ink-subtle">Audio queue</p>
          <div className="mt-3 rounded-panel bg-plate p-4 text-plate-pale">
            <div className="flex items-start gap-3.5">
              <button
                type="button"
                onClick={speech.status === 'playing' ? onPause : onResume}
                disabled={
                  speech.status === 'loading' ||
                  speech.status === 'failed' ||
                  speech.status === 'unsupported'
                }
                className="focus-ring mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-pale/60 text-gold-pale transition-colors hover:bg-gold-pale/10 disabled:opacity-50"
              >
                {speech.status === 'playing' ? <PauseMark /> : <PlayMark />}
                <span className="sr-only">
                  {speech.status === 'playing' ? 'Pause' : 'Play'} {speech.piece.title}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <Link
                  href={speech.piece.href}
                  className="focus-ring block truncate text-[0.875rem] font-semibold leading-[1.35] text-plate-pale hover:text-gold-pale"
                >
                  {speech.piece.title}
                </Link>
                <p className="kicker mt-1.5 text-gold-pale/70">
                  {speech.status === 'loading' && 'Fetching…'}
                  {speech.status === 'failed' && 'Could not read this one'}
                  {/* Said plainly, because it is not a fault the reader
                      can fix by pressing play again: the machine has no
                      voice for the browser to use. */}
                  {speech.status === 'unsupported' && 'No voice installed on this device'}
                  {(speech.status === 'playing' || speech.status === 'paused') && (
                    <>
                      <span className="tabular">{clock(speech.elapsed)}</span> /{' '}
                      {/* Approximate: the browser reports where it is in the
                          words, not in the minutes. */}
                      <span className="tabular">~{clock(speech.total)}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onStop}
                className="focus-ring -mr-1 mt-0.5 shrink-0 rounded-full p-1 text-plate-pale/60 transition-colors hover:text-plate-pale"
              >
                <CloseMark />
                <span className="sr-only">Stop reading</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 translate-x-px fill-current">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-current">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}

function CloseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 stroke-current" fill="none" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}
