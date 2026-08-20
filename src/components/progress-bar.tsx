'use client'

import * as React from 'react'
import { mark } from '@/lib/reading-progress'

/**
 * Thin gold reading-progress bar pinned to the very top of the viewport.
 *
 * It also remembers. Given the piece it is standing on, the same scroll
 * position that draws the bar is written to this browser so the archive
 * can offer the reader their way back into it. Nothing leaves the machine
 * — see reading-progress.ts.
 */
export function ReadingProgress({
  piece,
}: {
  /** Omitted on a page that is not a piece; then the bar only draws. */
  piece?: { slug: string; title: string; href: string; readMinutes: number }
}) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    let frame = 0
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  /* Written on the way out rather than on every frame: a reader scrolling
     a long teaching would otherwise touch localStorage a hundred times a
     second. `pagehide` fires where `beforeunload` does not on a phone. */
  const latest = React.useRef(progress)
  latest.current = progress
  React.useEffect(() => {
    if (!piece) return
    const save = () => mark({ ...piece, progress: latest.current })
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => {
      save()
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', save)
    }
  }, [piece])

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="h-full bg-gold transition-[width] duration-100 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
