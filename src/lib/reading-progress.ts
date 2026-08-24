'use client'

import * as React from 'react'

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
const BEGUN = 0.08

/** At or past this, a reader has read the piece. */
export const FINISHED = 0.95

export interface ReadingMark {
  slug: string
  title: string
  href: string
  /** 0–1. */
  progress: number
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
 */
export function mark(entry: Omit<ReadingMark, 'at'>): void {
  if (typeof window === 'undefined') return
  const held = read()
  const standing = held.find((candidate) => candidate.slug === entry.slug)
  const rest = held.filter((candidate) => candidate.slug !== entry.slug)
  const progress = Math.min(1, Math.max(entry.progress, standing?.progress ?? 0))

  if (progress < BEGUN) {
    write(rest)
    return
  }
  write([{ ...entry, progress, at: Date.now() }, ...rest])
}

/** Read to the end. */
export function isFinished(entry: Pick<ReadingMark, 'progress'>): boolean {
  return entry.progress >= FINISHED
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
 * Only a piece actually read to the end prints 100. Everything else is
 * rounded and left where it falls — which, since the finishing line is at
 * 95%, tops out at 95 and cannot round up into a claim. A shelf that says
 * 100% beside a teaching a reader knows they did not finish is a shelf
 * they stop believing.
 */
export function percentRead(entry: Pick<ReadingMark, 'progress'>): number {
  return isFinished(entry) ? 100 : Math.round(entry.progress * 100)
}
