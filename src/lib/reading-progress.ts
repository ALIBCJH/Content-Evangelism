'use client'

import * as React from 'react'
import { BEGIN_DEPTH, hasBegun, hasFinished } from '@/lib/reading-rule'

/**
 * Where a reader got to, and in what.
 *
 * The archive remembered what a reader had saved and nothing else, so
 * somebody returning to a twenty-minute teaching arrived at the top of an
 * identical page. This is the missing half of that: the piece they were
 * last in, how far down it they were, and roughly what is left.
 *
 * It is localStorage for the same reason `saved.ts` is. The site's
 * counters are deliberately anonymous — nothing is stored per reader on
 * the server, by design — and a resume marker is per reader by
 * definition. Keeping it in the browser is the only version of this
 * feature that does not walk that promise back.
 *
 * Only pieces genuinely begun are kept: under a tenth of the way in is
 * somebody who opened a page, and marking that as reading would fill the
 * shelf with things nobody read.
 *
 * A piece read to the end stays. It used to be thrown away at the moment
 * it was finished, on the grounds that "continue reading" should not
 * offer somebody the teaching they have just come to the end of — which
 * is true of the offer and wrong of the record. It meant this browser
 * remembered every teaching a reader had abandoned and none they had
 * finished, so the one question a reading history exists to answer —
 * which of these have I read? — was the one it could not. The offer
 * filters instead; see `unfinished`.
 */

const KEY = 'reading-progress'
/* A history rather than a resume marker, so it holds a reader's last
   several weeks rather than their last afternoon. Still bounded: this is
   one localStorage key, and an unbounded list in one is how a browser
   store becomes a problem nobody notices until it is full. */
const KEEP = 24

export interface ReadingMark {
  slug: string
  title: string
  href: string
  /** 0–1. */
  progress: number
  /**
   * Engaged seconds spent in this teaching, across every visit.
   *
   * Absent on a mark written before there was a clock in this — see
   * `isFinished`, which grandfathers those rather than telling a reader
   * they have not read something they have.
   */
  seconds?: number
  /** What the piece takes end to end, for working out what is left. */
  readMinutes: number
  /** When it was last open, so the rail can offer the most recent. */
  at: number
}

function read(): ReadingMark[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (mark): mark is ReadingMark =>
        Boolean(mark) && typeof mark.slug === 'string' && typeof mark.progress === 'number'
    )
  } catch {
    return []
  }
}

function write(marks: ReadingMark[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(marks.slice(0, KEEP)))
  } catch {
    /* A full or blocked store is not worth an error in a reader's face. */
  }
}

/**
 * Note where a reader is.
 *
 * A piece under way and a piece finished are both worth keeping; a page
 * merely opened is not. The furthest point reached is what is kept, so
 * scrolling back up to re-read a paragraph on the way out does not undo
 * the reading — and a teaching once finished stays finished.
 *
 * `seconds` arrives as the engaged time since this mark was last
 * written, not as a total, and is added to what is already held. A
 * reader who takes a teaching in three sittings has read it once. The
 * caller is responsible for sending each second only once; see the
 * `saved` ledger in `ProgressBar`.
 */
export function mark(entry: Omit<ReadingMark, 'at'>): void {
  if (typeof window === 'undefined') return
  const held = read()
  const standing = held.find((candidate) => candidate.slug === entry.slug)
  const rest = held.filter((candidate) => candidate.slug !== entry.slug)
  const progress = Math.min(1, Math.max(entry.progress, standing?.progress ?? 0))
  const seconds = Math.max(0, standing?.seconds ?? 0) + Math.max(0, entry.seconds ?? 0)

  /* Depth alone no longer opens the shelf: a page opened and nudged is
     not a teaching begun. */
  if (!hasBegun(progress, seconds)) {
    /* Still worth keeping what was already there — a reader who comes
       back for two seconds has not un-begun the teaching. */
    if (standing) write([{ ...standing, progress, seconds, at: Date.now() }, ...rest])
    else write(rest)
    return
  }
  write([{ ...entry, progress, seconds, at: Date.now() }, ...rest])
}

/**
 * Read to the end, and for long enough to have read it. See
 * `lib/reading-rule.ts` for why depth on its own will not do.
 *
 * A mark with no `seconds` was written before there was a clock in this,
 * and is judged the way it was judged when it was made. The alternative
 * is telling a reader on their next visit that they have not read four
 * teachings they know they read, which is a worse answer than a slightly
 * generous one about a handful of old marks.
 */
export function isFinished(entry: Pick<ReadingMark, 'progress' | 'seconds' | 'readMinutes'>): boolean {
  if (entry.seconds === undefined) return entry.progress >= 0.95
  return hasFinished(entry.progress, entry.seconds, entry.readMinutes)
}

/**
 * What to offer a reader coming back — everything begun and not finished,
 * most recent first. The shelf shows the whole history; this is the part
 * of it that is an invitation.
 */
export function unfinished(marks: ReadingMark[]): ReadingMark[] {
  return marks.filter((entry) => !isFinished(entry))
}

/** Drop one piece from the shelf. A reader may be done with it. */
export function forget(slug: string): void {
  if (typeof window === 'undefined') return
  write(read().filter((held) => held.slug !== slug))
  /* Written from one tab; the others are listening on `storage` but not
     for their own writes, so this tells the page it is on. */
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
}

/** Clear the shelf. */
export function forgetAll(): void {
  if (typeof window === 'undefined') return
  write([])
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
}

/** The pieces in hand, most recent first. */
export function useReadingProgress(): { ready: boolean; marks: ReadingMark[] } {
  const [marks, setMarks] = React.useState<ReadingMark[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setMarks(read().sort((a, b) => b.at - a.at))
    setReady(true)

    /* The same reader in another tab is still the same reader. */
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) setMarks(read().sort((a, b) => b.at - a.at))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { ready, marks }
}

/** What is left of a piece, in whole minutes, never less than one. */
export function minutesLeft(entry: Pick<ReadingMark, 'progress' | 'readMinutes'>): number {
  return Math.max(1, Math.round(entry.readMinutes * (1 - entry.progress)))
}

/**
 * The percentage as it is printed.
 *
 * Only a piece that satisfies `isFinished` prints 100 — and since that
 * now asks for time as well as depth, a teaching flicked to the bottom
 * prints its depth rather than a hundred. Everything else is rounded and
 * left where it falls, capped just under a hundred so it cannot round up
 * into a claim. A shelf that says 100% beside a teaching a reader knows
 * they did not finish is a shelf they stop believing.
 */
export function percentRead(entry: Pick<ReadingMark, 'progress' | 'seconds' | 'readMinutes'>): number {
  return isFinished(entry) ? 100 : Math.min(99, Math.round(entry.progress * 100))
}
