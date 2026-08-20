'use client'

import * as React from 'react'
import { report } from '@/lib/insight-report'

/**
 * Counting a teaching that is read where it was not published.
 *
 * The archive reads a teaching in place now: the body arrives under the
 * lead card and the reader never leaves the front page. The page tracker
 * counts the path in the address bar, so every one of those readings was
 * being recorded as a visit to `/` — and the teaching's own counters, the
 * ones "most read" is ordered by and the desk reads on its dashboard,
 * never moved at all.
 *
 * So a reading is counted against the teaching wherever it happens. The
 * same three numbers the page tracker keeps, on the same terms:
 *
 *   - a view, once the body is actually on screen rather than merely
 *     fetched — the fetch runs a screen early, and a reader who never
 *     scrolls that far has not read anything;
 *   - engaged seconds, counted only while the teaching is in view, the
 *     tab is visible, and the reader has done something recently;
 *   - finished, when nine tenths of it has passed the fold.
 *
 * Nothing here identifies anybody, because there is nothing here to
 * identify anybody with: it is three integers and a path.
 */

const IDLE_AFTER_MS = 2 * 60 * 1000
const FLUSH_EVERY_MS = 30 * 1000
const FINISHED_AT = 0.9

/** How far through an element the page has been scrolled, 0 to 1. */
export function progressThrough(
  box: { top: number; height: number },
  scrollY: number,
  viewport: number
): number {
  const begins = box.top + scrollY
  const ends = begins + box.height - viewport
  const run = ends - begins
  if (run <= 0) return scrollY >= begins ? 1 : 0
  return Math.min(1, Math.max(0, (scrollY - begins) / run))
}

/** Whether any part of the element is on screen. */
export function inView(box: { top: number; height: number }, viewport: number): boolean {
  return box.top < viewport && box.top + box.height > 0
}

export function useReadInsight(
  region: React.RefObject<HTMLElement>,
  piece: { slug: string } | null,
  ready: boolean
): void {
  /* The slug and not the object. The caller builds that object inline, so
     it is a new one on every render — and the archive re-renders twice a
     second while a teaching is being read aloud. Watching the object
     would tear this down and re-arm it each time, and every re-arm counts
     another reading of a teaching nobody opened twice. */
  const slug = piece?.slug ?? null

  React.useEffect(() => {
    const element = region.current
    if (!ready || !slug || !element) return

    const path = `/articles/${slug}`
    let seconds = 0
    let views = 0
    let finished = 0
    let counted = false
    let done = false
    let lastActive = Date.now()
    let lastTick = Date.now()

    const send = (useBeacon: boolean) => {
      if (!views && !seconds && !finished) return
      const batch = { path, views, seconds, finished, clicks: [] }
      views = 0
      seconds = 0
      finished = 0
      report([batch], useBeacon)
    }

    const measure = () => {
      const node = region.current
      if (!node) return null
      const box = node.getBoundingClientRect()
      return { top: box.top, height: node.offsetHeight }
    }

    const tick = window.setInterval(() => {
      const now = Date.now()
      const elapsed = Math.round((now - lastTick) / 1000)
      lastTick = now
      if (document.visibilityState !== 'visible') return
      if (now - lastActive > IDLE_AFTER_MS) return
      const box = measure()
      if (!box || !inView(box, window.innerHeight)) return
      seconds += Math.max(0, Math.min(elapsed, 10))
    }, 1000)

    const onScroll = () => {
      lastActive = Date.now()
      const box = measure()
      if (!box) return
      /* The view is counted when the teaching is actually on screen, not
         when it was fetched a screen ahead of the reader. */
      if (!counted && inView(box, window.innerHeight)) {
        counted = true
        views = 1
      }
      if (!done && progressThrough(box, window.scrollY, window.innerHeight) > FINISHED_AT) {
        done = true
        finished = 1
      }
    }

    const onActivity = () => {
      lastActive = Date.now()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') send(true)
      else lastTick = Date.now()
    }
    const onPageHide = () => send(true)

    onScroll()
    const flush = window.setInterval(() => send(false), FLUSH_EVERY_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      send(true)
      window.clearInterval(tick)
      window.clearInterval(flush)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
    /* Re-armed when the piece under the card changes, which is what makes
       the second teaching a reader scrolls to its own reading. */
  }, [region, slug, ready])
}
