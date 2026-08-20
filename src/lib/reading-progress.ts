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
 * rail with things nobody read.
 */

const KEY = 'reading-progress'
const KEEP = 6
const BEGUN = 0.08
const FINISHED = 0.95

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
 * Note where a reader is. Finished pieces are dropped rather than parked
 * at 99%: "continue reading" should not offer somebody the teaching they
 * just came to the end of.
 */
export function mark(entry: Omit<ReadingMark, 'at'>): void {
  if (typeof window === 'undefined') return
  const rest = read().filter((held) => held.slug !== entry.slug)
  const keep =
    entry.progress >= BEGUN && entry.progress < FINISHED
      ? [{ ...entry, at: Date.now() }, ...rest]
      : rest
  write(keep)
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
