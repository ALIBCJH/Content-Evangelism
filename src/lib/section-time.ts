'use client'

import * as React from 'react'
import { report } from '@/lib/insight-report'

/**
 * Which chapter of a teaching a reader is in, and for how long.
 *
 * The page total says a teaching held somebody eleven minutes. It cannot
 * say that nine of them went on the two sections about repentance and
 * that nobody stays for the last chapter — which is the thing a desk
 * would actually change a teaching over.
 *
 * A section is the run of the page from one `## ` heading to the next,
 * which is what a reader means by "the part about X" and what the anchors
 * in the contents list already point at. The seconds are the same engaged
 * seconds the rest of the counters use: the tab has to be visible, the
 * reader has to have done something in the last two minutes, and the
 * clock stops otherwise.
 *
 * Nothing here identifies anybody. What is stored is a heading anchor and
 * a number of seconds, summed across every reader the site has ever had.
 */

const IDLE_AFTER_MS = 2 * 60 * 1000
const FLUSH_EVERY_MS = 30 * 1000

/**
 * The reading line: a third of the way down the window rather than its
 * top edge, because that is roughly where the eye sits, and a heading
 * scrolled just past the top is a section the reader has begun.
 */
const READING_LINE = 0.3

/**
 * The chapter the reading line has reached.
 *
 * Marks are viewport-relative tops, in document order. Above the first
 * heading is the teaching's opening, which belongs to no chapter and is
 * reported as none rather than credited to the first.
 */
export function activeSection(
  marks: { id: string; top: number }[],
  line: number
): string | null {
  let current: string | null = null
  for (const mark of marks) {
    if (mark.top <= line) current = mark.id
    else break
  }
  return current
}

export function useSectionTime(
  /** The teaching being read, as the store names it. Null stops the clock. */
  path: string | null,
  /** The heading anchors, in the order they appear. */
  ids: string[],
  enabled: boolean
): void {
  /* Joined, so a caller building the array inline does not re-arm this on
     every render — the same fault the reading counter had. */
  const key = ids.join(',')

  React.useEffect(() => {
    if (!enabled || !path || key.length === 0) return

    const anchors = key.split(',')
    let seconds: Record<string, number> = {}
    let lastActive = Date.now()
    let lastTick = Date.now()

    const send = (useBeacon: boolean) => {
      if (Object.keys(seconds).length === 0) return
      const sections = seconds
      seconds = {}
      report([{ path, sections }], useBeacon)
    }

    const tick = window.setInterval(() => {
      const now = Date.now()
      const elapsed = Math.round((now - lastTick) / 1000)
      lastTick = now
      if (document.visibilityState !== 'visible') return
      if (now - lastActive > IDLE_AFTER_MS) return

      const marks = anchors
        .map((id) => {
          const node = document.getElementById(id)
          return node ? { id, top: node.getBoundingClientRect().top } : null
        })
        .filter((mark): mark is { id: string; top: number } => mark !== null)

      const id = activeSection(marks, window.innerHeight * READING_LINE)
      if (!id) return
      seconds[id] = (seconds[id] ?? 0) + Math.max(0, Math.min(elapsed, 10))
    }, 1000)

    const onActivity = () => {
      lastActive = Date.now()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') send(true)
      else lastTick = Date.now()
    }
    const onPageHide = () => send(true)

    const flush = window.setInterval(() => send(false), FLUSH_EVERY_MS)
    window.addEventListener('scroll', onActivity, { passive: true })
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      send(true)
      window.clearInterval(tick)
      window.clearInterval(flush)
      window.removeEventListener('scroll', onActivity)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [path, key, enabled])
}

/** The hook as a component, for a server-rendered page to drop in. */
export function SectionTimer({ path, ids }: { path: string; ids: string[] }) {
  useSectionTime(path, ids, true)
  return null
}
