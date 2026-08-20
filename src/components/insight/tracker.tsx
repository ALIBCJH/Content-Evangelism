'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import type { ClickLabel } from '@/lib/insight-shape'
import { optedOut, report } from '@/lib/insight-report'

/**
 * The reader-side half of the counters.
 *
 * It answers two questions and no others: which pages are read, and how
 * long readers stay with them. It sets no cookie, issues no identifier,
 * and reads nothing about the device. Two visits by one reader and one
 * visit by two are the same thing to it, deliberately.
 *
 * Three details decide whether the time it reports means anything.
 *
 * It counts *engaged* time, not elapsed time. A tab left open behind
 * another window is not reading, so the clock stops when the page is
 * hidden, and stops again after two minutes with no scroll, no key and no
 * pointer — a teaching left open over lunch would otherwise report as the
 * most gripping thing on the site.
 *
 * It reports with `sendBeacon`, which is the only way to be heard while
 * the page is closing. A `fetch` at that moment is cancelled with the
 * document, and the whole reading would be lost — which is precisely the
 * reading worth having.
 *
 * And it obeys Do Not Track and Global Privacy Control by not running at
 * all. A reader who has asked not to be counted is not counted.
 */

const IDLE_AFTER_MS = 2 * 60 * 1000
const FLUSH_EVERY_MS = 30 * 1000

export function Tracker() {
  const pathname = usePathname()

  React.useEffect(() => {
    if (optedOut()) return

    let seconds = 0
    let clicks: ClickLabel[] = []
    let finished = 0
    let views = 1
    let lastActive = Date.now()
    let lastTick = Date.now()

    const send = (useBeacon: boolean) => {
      if (!seconds && !clicks.length && !finished && !views) return
      const batch = { path: pathname, views, seconds, finished, clicks }
      views = 0
      seconds = 0
      finished = 0
      clicks = []
      report([batch], useBeacon)
    }

    /* One second of engaged time, only if the page is visible and the
       reader has done something recently. */
    const tick = window.setInterval(() => {
      const now = Date.now()
      const elapsed = Math.round((now - lastTick) / 1000)
      lastTick = now
      if (document.visibilityState !== 'visible') return
      if (now - lastActive > IDLE_AFTER_MS) return
      seconds += Math.max(0, Math.min(elapsed, 10))
    }, 1000)

    const flush = window.setInterval(() => send(false), FLUSH_EVERY_MS)

    const onActivity = () => {
      lastActive = Date.now()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') send(true)
      else lastTick = Date.now()
    }
    const onPageHide = () => send(true)

    /* Reaching the foot of a piece is the closest thing to "read it". */
    const onScroll = () => {
      onActivity()
      if (finished) return
      const reachable = document.body.scrollHeight - window.innerHeight
      if (reachable > 400 && window.scrollY / reachable > 0.9) finished = 1
    }

    /* One delegated listener rather than a prop threaded through every
       component that happens to be a link. */
    const onClick = (event: MouseEvent) => {
      onActivity()
      const el = (event.target as HTMLElement | null)?.closest?.('[data-track]')
      const label = el?.getAttribute('data-track') as ClickLabel | null
      if (label) clicks.push(label)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('click', onClick, true)

    return () => {
      send(true)
      window.clearInterval(tick)
      window.clearInterval(flush)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('click', onClick, true)
    }
  }, [pathname])

  return null
}
